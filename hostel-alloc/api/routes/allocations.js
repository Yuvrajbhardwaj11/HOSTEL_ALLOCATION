const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Student = require('../models/Student');
const Room = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');

// GET all allocations
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, academicYear } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (academicYear) filter.academicYear = academicYear;
    const allocations = await Allocation.find(filter)
      .populate('student', 'studentId name email department year gender')
      .populate('room', 'roomNumber block floor type amenities monthlyRent')
      .populate('allocatedBy', 'name')
      .sort({ allocationDate: -1 });
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST manual allocation
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { studentId, roomId, academicYear, checkInDate, remarks } = req.body;
    const student = await Student.findById(studentId);
    const room = await Room.findById(roomId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.status === 'Full') return res.status(400).json({ message: 'Room is full' });
    if (room.status === 'Maintenance') return res.status(400).json({ message: 'Room is under maintenance' });
    if (student.allocationStatus === 'Allocated') return res.status(400).json({ message: 'Student already allocated' });

    // Gender check
    if (room.gender !== 'Mixed' && room.gender !== student.gender) {
      return res.status(400).json({ message: `This room is designated for ${room.gender} students` });
    }

    const allocation = await Allocation.create({
      student: studentId, room: roomId, allocatedBy: req.user._id,
      academicYear: academicYear || getCurrentAcademicYear(),
      checkInDate, remarks, allocationType: 'Manual'
    });

    room.currentOccupancy += 1;
    await room.save();
    student.allocationStatus = 'Allocated';
    await student.save();

    const populated = await Allocation.findById(allocation._id)
      .populate('student', 'studentId name email department year gender')
      .populate('room', 'roomNumber block floor type monthlyRent');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST auto-allocate all pending students
router.post('/auto-allocate', protect, adminOnly, async (req, res) => {
  try {
    const { academicYear } = req.body;
    const year = academicYear || getCurrentAcademicYear();

    // Get pending students sorted by priority
    const pendingStudents = await Student.find({ allocationStatus: 'Pending' }).sort({ priority: -1, appliedAt: 1 });
    // Get available rooms
    const availableRooms = await Room.find({ status: { $in: ['Available'] } });

    const results = { allocated: [], waitlisted: [], failed: [] };

    for (const student of pendingStudents) {
      // Find best matching room
      const suitableRooms = availableRooms.filter(room => {
        if (room.currentOccupancy >= room.capacity) return false;
        if (room.gender !== 'Mixed' && room.gender !== student.gender) return false;
        if (student.isPhysicallyDisabled && !room.isAccessible && room.floor > 0) return false;
        if (student.preferences?.roomType !== 'Any' && room.type !== student.preferences?.roomType) return false;
        return true;
      });

      if (suitableRooms.length === 0) {
        student.allocationStatus = 'Waitlisted';
        await student.save();
        results.waitlisted.push({ studentId: student.studentId, name: student.name, reason: 'No suitable rooms' });
        continue;
      }

      // Sort rooms: prefer ones with fewer occupants for even distribution
      suitableRooms.sort((a, b) => (a.currentOccupancy / a.capacity) - (b.currentOccupancy / b.capacity));
      const room = suitableRooms[0];

      const allocation = await Allocation.create({
        student: student._id, room: room._id,
        allocatedBy: req.user._id, academicYear: year, allocationType: 'Auto'
      });

      room.currentOccupancy += 1;
      await room.save();
      student.allocationStatus = 'Allocated';
      await student.save();

      // Update local reference
      const roomIndex = availableRooms.findIndex(r => r._id.equals(room._id));
      if (roomIndex >= 0) availableRooms[roomIndex] = room;

      results.allocated.push({ studentId: student.studentId, name: student.name, room: room.roomNumber, block: room.block });
    }

    res.json({
      message: 'Auto-allocation complete',
      summary: { allocated: results.allocated.length, waitlisted: results.waitlisted.length },
      results
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE / vacate allocation
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

    allocation.status = 'Vacated';
    allocation.checkOutDate = new Date();
    await allocation.save();

    await Room.findByIdAndUpdate(allocation.room, { $inc: { currentOccupancy: -1 } });
    await Student.findByIdAndUpdate(allocation.student, { allocationStatus: 'Pending' });

    res.json({ message: 'Allocation vacated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 7 ? `${year}-${(year + 1).toString().slice(2)}` : `${year - 1}-${year.toString().slice(2)}`;
}

module.exports = router;
