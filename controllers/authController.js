const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
    const { name, email, password,studentId, role, parentEmail } = req.body;
    // Validate input
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Ensure parentEmail is provided for students
  if (role === "student" && !parentEmail) {
    return res.status(400).json({ message: "Parent email is required for students" });
  }
  
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
 
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword,studentId, role, parentEmail });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
}; 

exports.loginStudent = async (req, res) => {
  const { studentId, password } = req.body;

  try {
    const user = await User.findOne({ studentId, role: "student" });
    if (!user) return res.status(404).json({ message: "Student not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, "your_jwt_secret", { expiresIn: "1h" });

    res.json({ token, user: { id: user._id, name: user.name, studentId: user.studentId } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Fetch full user details
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// exports.getMe = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ user: req.user }); // Send user details
//   } catch (error) {
//     res.status(500).json({ message: "Server error" });
//   }
// };



// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// exports.register = async (req, res) => {
//     const { name, email, password,studentId, role, parentEmail } = req.body;
//     // Validate input
//   if (!name || !email || !password || !role) {
//     return res.status(400).json({ message: "All fields are required" });
//   }

//   // Ensure parentEmail is provided for students
//   if (role === "student" && !parentEmail) {
//     return res.status(400).json({ message: "Parent email is required for students" });
//   }
  
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'Email already exists' });
//     }
 
//     try {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const user = new User({ name, email, password: hashedPassword,studentId, role, parentEmail });
//         await user.save();

//         res.status(201).json({ message: 'User registered successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Server error: ' + error.message });
//     }
// };

// exports.login = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         const user = await User.findOne({ email });
//         if (!user) return res.status(404).json({ error: 'User not found' });

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

//         const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

//         res.status(200).json({ token, role: user.role});
//     } catch (error) {
//         res.status(500).json({ error: 'Server error: ' + error.message });
//     }
// };

// exports.loginStudent = async (req, res) => {
//   const { studentId, password } = req.body;

//   try {
//     const user = await User.findOne({ studentId, role: "student" });
//     if (!user) return res.status(404).json({ message: "Student not found" });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

//     // Generate JWT
//     const token = jwt.sign({ id: user._id, role: user.role }, "your_jwt_secret", { expiresIn: "1h" });

//     res.json({ token, user: { id: user._id, name: user.name, studentId: user.studentId } });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
