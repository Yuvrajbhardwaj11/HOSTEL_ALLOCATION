const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, adminOnly } = require('../middleware/auth');

// GET all students
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status, gender, department, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.allocationStatus = status;
    if (gender) filter.gender = gender;
    if (department) filter.department = department;

    const students = await Student.find(filter)
      .sort({ priority: -1, appliedAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Student.countDocuments(filter);
    res.json({ students, total, pages: Math.ceil(total / limit), page });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create student
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET single student
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update student
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE student
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET priority-ranked list
router.get('/ranked/list', protect, adminOnly, async (req, res) => {
  try {
    const students = await Student.find({ allocationStatus: 'Pending' }).sort({ priority: -1, appliedAt: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
