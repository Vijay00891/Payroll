const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema({
  date: { type: String, required: true },
  hours: { type: Number, required: true },
  clockIn: { type: String },
  clockOut: { type: String },
  description: { type: String },
}, { _id: false });

const holidaySchema = new mongoose.Schema({
  date: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['national', 'company', 'personal'], default: 'company' },
}, { _id: false });

const leaveSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity'] },
  days: { type: Number, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason: { type: String },
  approvedBy: { type: String },
  approvedAt: { type: Date },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  employeeId: { type: String, unique: true },
  department: { type: String },
  position: { type: String },
  avatar: { type: String, default: null },

  // payroll / tracking fields
  hourlyRate: { type: Number, default: 25 }, // dollars per hour
  totalHours: { type: Number, default: 0 }, // cumulative tracked hours
  bonus: { type: Number, default: 0 }, // additional bonus amount
  workingHours: { type: [workingHoursSchema], default: [] }, // detailed working hours log
  holidays: { type: [holidaySchema], default: [] },
  leaves: { type: [leaveSchema], default: [] },

  // additional tracking fields
  joinDate: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
