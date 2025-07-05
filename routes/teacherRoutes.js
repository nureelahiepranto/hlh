const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const {
  addTeacher,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  ApprovedTeacher,
  ApprovedTeacherGet,
} = require("../controllers/teacherController.js");

const { adminMiddleware , verifyAdmin, authMiddleware } = require("../middlewares/authMiddleware.js");
const upload = require("../middlewares/upload.js");
const Teacher = require("../models/Teacher.js");

const router = express.Router();



router.post("/add",authMiddleware, upload.single("image"),  addTeacher); // Add teacher
router.get("/list",authMiddleware, getTeachers); // Get all teachers
router.put("/update/:id", updateTeacher); // Update teacher
router.delete("/delete/:id", deleteTeacher); // Delete teacher
router.put('/approve-teacher/:teacherId', ApprovedTeacher)
router.get('/ApprovedTeacherGet', ApprovedTeacherGet);



// GET all approved teachers with user details
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await Teacher.find() // Get only approved teachers
      .populate("userId", "name"); // Populate user details (name, email, role)

    res.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
