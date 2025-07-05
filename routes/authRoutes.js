const express = require('express');
const { login, register, loginStudent, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware.js');
const User = require('../models/User.js');
const router = express.Router();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
require("dotenv").config();

router.post('/register', register);
router.post('/', login);
router.post("/student-login", loginStudent);
router.get("/me", authMiddleware, getMe);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) { 
      res.status(400).json({ message: 'Invalid token.' });
    }
  };
  
  // Get current user endpoint
  router.get('/me', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  });

  // Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store verification codes temporarily
const resetTokens = {};

// 1. Send Email with Verification Code
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    resetTokens[email] = { code: verificationCode, expires: Date.now() + 10 * 60 * 1000 };

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Code",
      text: `Your verification code is: ${verificationCode}. It expires in 10 minutes.`,
    });

    res.json({ message: "Verification code sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Verify Code and Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const tokenData = resetTokens[email];
    if (!tokenData || tokenData.code !== code || Date.now() > tokenData.expires) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    delete resetTokens[email]; // Remove used token

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
