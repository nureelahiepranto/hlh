const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date: { type: Date, default: Date.now },

  presentStartTime: { type: Date },   // 9:00 AM - 10:00 AM
  afternoonAttendance: { type: Date }, // 3:30 PM - 4:00 PM
  presentEndTime: { type: Date },     // 9:00 PM - 10:00 PM

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Attendance", attendanceSchema);

// const mongoose = require("mongoose");

// const attendanceSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
//   date: { type: Date, default: Date.now },
//   timestamp: { type: Date, default: Date.now }, // Store the timestamp of attendance
//   presentStartTime: { type: Date }, // Time when attendance is marked as present
//   presentEndTime: { type: Date },  // Time when attendance is marked as end
// });

// module.exports = mongoose.model("Attendance", attendanceSchema);
