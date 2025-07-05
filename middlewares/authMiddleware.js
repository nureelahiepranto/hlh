const jwt = require("jsonwebtoken");
const Teacher = require("../models/Teacher.js");
const Admin = require("../models/Admin");
const User = require("../models/User.js");

const verifyTeacher = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "secretKey");
    const teacher = await Teacher.findById(decoded.id);
    if (!teacher) return res.status(403).json({ message: "Access denied" });
    req.teacher = teacher;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "secretKey");
    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(403).json({ message: "Access denied" });
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// const authMiddleware = (req, res, next) => {
//   const authHeader = req.header("Authorization");

//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).json({ message: "Access Denied. No Token Provided!" });
//   }

//   const token = authHeader.split(" ")[1]; // Extract token

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified; // Attach user info to request
//     next();
//   } catch (error) {
//     res.status(400).json({ message: "Invalid Token" });
//   }
// };

const authMiddleware = async (req, res, next) => {
  try {
    // ✅ Extract token correctly
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1]; // ✅ Extract the actual token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // ✅ Verify token

    req.user = await User.findById(decoded.id).select("-password"); // ✅ Get user from DB

    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("JWT Error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { verifyTeacher, verifyAdmin , authMiddleware , adminMiddleware };
