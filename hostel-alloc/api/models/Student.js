const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  department: {
    type: String,
    required: true,
    enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics', 'Chemical', 'Mathematics', 'Physics', 'Other']
  },
  year: { type: Number, required: true, min: 1, max: 5 },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  income: { type: Number, default: 0 }, // Annual family income
  isPhysicallyDisabled: { type: Boolean, default: false },
  isLocalStudent: { type: Boolean, default: false },
  priority: { type: Number, default: 0 }, // Computed priority score
  allocationStatus: {
    type: String,
    enum: ['Pending', 'Allocated', 'Waitlisted', 'Rejected'],
    default: 'Pending'
  },
  preferences: {
    roomType: { type: String, enum: ['Single', 'Double', 'Triple', 'Any'], default: 'Any' },
    floor: { type: String, enum: ['Ground', 'First', 'Second', 'Third', 'Any'], default: 'Any' },
    hostelBlock: { type: String, default: 'Any' }
  },
  appliedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-compute priority score before saving
studentSchema.pre('save', function (next) {
  let score = 0;
  score += this.cgpa * 5;                          // CGPA weight
  if (this.isPhysicallyDisabled) score += 30;      // Disability priority
  if (this.income < 200000) score += 20;           // Low income
  else if (this.income < 500000) score += 10;
  score += (6 - this.year) * 3;                    // Higher year = higher priority
  if (!this.isLocalStudent) score += 15;           // Outstation students
  this.priority = score;
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
