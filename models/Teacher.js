const mongoose = require("mongoose");

const TeacherSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Reference User model
  phone: { type: String, required: true },
  address: { type: String, required: true },
  image: { type: String, required: false }, // Cloudinary URL
  isApproved: { type: Boolean, default: false }, // Approval Status
}, { timestamps: true });

module.exports = mongoose.model("Teacher", TeacherSchema);

// canTakeAttendance