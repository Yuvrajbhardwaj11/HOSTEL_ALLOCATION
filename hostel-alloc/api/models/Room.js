const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  block: { type: String, required: true },
  floor: { type: Number, required: true, min: 0, max: 10 },
  type: { type: String, required: true, enum: ['Single', 'Double', 'Triple'] },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Mixed'] },
  amenities: [{
    type: String,
    enum: ['AC', 'WiFi', 'Attached Bathroom', 'Balcony', 'Study Table', 'Wardrobe', 'Fan']
  }],
  monthlyRent: { type: Number, required: true },
  isAccessible: { type: Boolean, default: false }, // Wheelchair accessible
  status: { type: String, enum: ['Available', 'Full', 'Maintenance', 'Reserved'], default: 'Available' },
  createdAt: { type: Date, default: Date.now }
});

roomSchema.virtual('availableSlots').get(function () {
  return this.capacity - this.currentOccupancy;
});

roomSchema.pre('save', function (next) {
  if (this.currentOccupancy >= this.capacity) {
    this.status = 'Full';
  } else if (this.status === 'Full' && this.currentOccupancy < this.capacity) {
    this.status = 'Available';
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
