const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now }, // Store the timestamp of attendance
  presentStartTime: { type: Date }, // Time when attendance is marked as present
  presentEndTime: { type: Date },  // Time when attendance is marked as end
});

module.exports = mongoose.model("Attendance", attendanceSchema);
