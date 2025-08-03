const express = require("express");
const router = express.Router();
const User = require("../models/User.js");
const Attendance = require("../models/Attendance.js");

// Get Dashboard Stats
router.get("/stats", async (req, res) => {
  try {
    const students = await User.countDocuments({ role: "student" });
    const teachers = await User.countDocuments({ role: "teacher" });
    const revenue = await User.aggregate([{ $group: { _id: null, total: { $sum: "$feesPaid" } } }]);
    const todayAttendance = await Attendance.countDocuments({ date: new Date().toISOString().slice(0, 10) });

    res.json({
      students,
      teachers,
      revenue: revenue[0]?.total || 0,
      attendance: ((todayAttendance / students) * 100).toFixed(2),
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching stats" });
  }
});

// Get Recent Activities
router.get("/recent-activities", async (req, res) => {
  try {
    const activities = [
      "New Employee John Doe enrolled.",
      "Mr. Smith marked attendance.",
      "$5,000 fees collected today.",
      "Employee schedules updated.",
    ];
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: "Error fetching activities" });
  }
});

module.exports = router;
