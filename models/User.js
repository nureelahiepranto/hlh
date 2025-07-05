const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true, sparse: true },
  password: String,
  studentId: { type: String }, // 🔁 Fixed here
  role: { type: String, enum: ['admin', 'teacher', 'student', 'accountant'], default: 'student' },
  phone: String,
  fees: { type: Number, default: 0 },
  attendance: [{ date: String, status: String }],
  createdAt: { type: Date, default: Date.now },
  profileImage: String,
});

// ✅ Add this below your schema definition
UserSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $exists: true, $ne: null } } }
);

module.exports = mongoose.model('User', UserSchema);
