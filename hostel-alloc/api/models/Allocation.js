const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  allocatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  allocationDate: { type: Date, default: Date.now },
  checkInDate: { type: Date },
  checkOutDate: { type: Date },
  academicYear: { type: String, required: true }, // e.g., "2024-25"
  status: {
    type: String,
    enum: ['Active', 'Vacated', 'Transferred', 'Cancelled'],
    default: 'Active'
  },
  allocationType: { type: String, enum: ['Auto', 'Manual'], default: 'Auto' },
  remarks: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Allocation', allocationSchema);
