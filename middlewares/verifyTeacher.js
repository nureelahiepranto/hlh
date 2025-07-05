const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher");

const verifyTeacher = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    console.log("🔍 Authorization Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("🚨 No valid token found in request headers!");
      return res.status(401).json({ message: "Unauthorized access. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    console.log("✅ Extracted Token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Decoded Token Data:", decoded);

    const teacher = await Teacher.findOne({ userId: decoded.id }); // Search by userId instead of _id
    if (!teacher) {
      console.log("❌ Teacher not found in database.");
      return res.status(404).json({ message: "Teacher not found." });
    }

    if (!teacher.isApproved) {
      console.log("⛔ Teacher is not approved.");
      return res.status(403).json({ message: "Your account is not approved yet." });
    }

    req.teacher = teacher;
    next();
  } catch (error) {
    console.error("❌ Error in verifyTeacher middleware:", error.message);
    res.status(500).json({ message: "Server error in authentication." });
  }
};

module.exports = verifyTeacher;