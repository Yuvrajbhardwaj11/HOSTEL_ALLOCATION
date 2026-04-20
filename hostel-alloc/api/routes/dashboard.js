const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Room = require('../models/Room');
const Allocation = require('../models/Allocation');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [
      totalStudents, allocatedStudents, pendingStudents, waitlistedStudents,
      totalRooms, availableRooms, fullRooms, maintenanceRooms,
      totalAllocations, maleStudents, femaleStudents
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ allocationStatus: 'Allocated' }),
      Student.countDocuments({ allocationStatus: 'Pending' }),
      Student.countDocuments({ allocationStatus: 'Waitlisted' }),
      Room.countDocuments(),
      Room.countDocuments({ status: 'Available' }),
      Room.countDocuments({ status: 'Full' }),
      Room.countDocuments({ status: 'Maintenance' }),
      Allocation.countDocuments({ status: 'Active' }),
      Student.countDocuments({ gender: 'Male' }),
      Student.countDocuments({ gender: 'Female' })
    ]);

    const deptBreakdown = await Student.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const roomOccupancy = await Room.aggregate([
      { $group: { _id: '$block', totalCapacity: { $sum: '$capacity' }, totalOccupancy: { $sum: '$currentOccupancy' } } },
      { $sort: { _id: 1 } }
    ]);

    const recentAllocations = await Allocation.find({ status: 'Active' })
      .populate('student', 'studentId name department')
      .populate('room', 'roomNumber block')
      .sort({ allocationDate: -1 })
      .limit(5);

    res.json({
      students: { total: totalStudents, allocated: allocatedStudents, pending: pendingStudents, waitlisted: waitlistedStudents, male: maleStudents, female: femaleStudents },
      rooms: { total: totalRooms, available: availableRooms, full: fullRooms, maintenance: maintenanceRooms },
      allocations: { total: totalAllocations },
      deptBreakdown,
      roomOccupancy,
      recentAllocations
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
