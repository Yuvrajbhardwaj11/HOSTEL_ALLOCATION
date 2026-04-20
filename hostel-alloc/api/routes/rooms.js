const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');

// GET all rooms
router.get('/', protect, async (req, res) => {
  try {
    const { status, gender, type, block } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (type) filter.type = type;
    if (block) filter.block = block;
    const rooms = await Room.find(filter).sort({ block: 1, floor: 1, roomNumber: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create room
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST bulk create rooms
router.post('/bulk', protect, adminOnly, async (req, res) => {
  try {
    const { rooms } = req.body;
    const created = await Room.insertMany(rooms);
    res.status(201).json({ created: created.length, rooms: created });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET single room
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update room
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE room
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
