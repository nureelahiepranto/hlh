const bcrypt = require('bcryptjs');
const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');
const Student = require('../models/Student');
// Get all students
const getAllStudents = async (req, res) => {
  try {
    // const students = await User.find({ role: "student" });
    const students = await Student.find().populate('userId', 'name email profileImage');
    res.json(students,);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error: error.message });
  }
};


const createStudent = async (req, res) => {

  try {
    const { name, email, password, address, phone, parentEmail } = req.body;

    // Ensure all required fields are present
    if (!req.file) {
      return res.status(400).json({ message: 'Profile image is required' });
    }

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check for duplicate roll number in the same class
    // const existingRollNumber = await Student.findOne({ className, rollNumber });
    // if (existingRollNumber) {
    //   return res.status(400).json({ message: 'Roll number already exists in this class' });
    // }

    if (phone.length < 11) {
      return res.status(400).json({ message: 'Phone number must be exactly 11 digits' });
    }


    // Upload image to Cloudinary
    const profileImage = req.file ? req.file.path : null; // Cloudinary returns the image URL in `req.file.path`

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'student',
      profileImage, // Cloudinary URL
    });
    await user.save();

    // Create Student details
    const student = new Student({
      userId: user._id,
      address,
      phone,
      parentEmail,
    });
    await student.save();

    res.status(201).json({ message: 'Student created successfully', user, student });
  } catch (error) {
    console.log(error.message);
    
    res.status(500).json({
      message: 'Error creating student',
      error: error.message,
    });
  }
}

module.exports = { getAllStudents , createStudent};