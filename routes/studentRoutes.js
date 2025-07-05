const express = require('express');
const { body } = require('express-validator');
const { getAllStudents, createStudent } = require("../controllers/studentController.js");
const router = express.Router();
const Student = require('../models/Student.js');
const upload = require("../utils/cloudinaryUpload.js"); // Import Cloudinary config

// Get all students
router.get("/students", getAllStudents);

// Create student with Cloudinary image upload
router.post(
  '/students',
  upload.single('profileImage'), // Use Cloudinary for image upload
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('className').notEmpty().withMessage('Class name is required'),
    body('rollNumber').isNumeric().withMessage('Roll number must be a number'),
    body('phone').isLength({ min: 11 }).withMessage('Phone number must contain only numbers'),
    body('parentEmail').isEmail().withMessage('Invalid parent email format'),
  ],
  createStudent
);

module.exports = router;
