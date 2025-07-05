const bcrypt = require("bcryptjs");
const User = require("../models/User.js");
const Teacher = require("../models/Teacher.js");
const cloudinary = require("../utils/cloudinary"); // Cloudinary setup


// Add a teacher
const addTeacher = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Upload image to Cloudinary if available
    let imageUrl = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    // Create a new User as Teacher
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "teacher",
    });

    await user.save();

    // Create a new Teacher record
    const teacher = new Teacher({
      userId: user._id,
      phone,
      address,
      image: imageUrl, // Fix missing image issue
    });

    await teacher.save();

    res.status(201).json({ message: "Teacher added successfully", teacher });
  } catch (error) {
    console.error("Add Teacher Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all teachers
const getTeachers = async (req, res) => {
  try {
    // Fetch teachers from the User collection and join with Teacher data
    const teachers = await User.aggregate([
      {
        $match: { role: "teacher" }, // Get only teachers
      },
      {
        $lookup: {
          from: "teachers", // Collection name of Teacher model
          localField: "_id",
          foreignField: "userId",
          as: "teacherDetails",
        },
      },
      {
        $unwind: {
          path: "$teacherDetails",
          preserveNullAndEmptyArrays: true, // Keep user data even if teacher data is missing
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          "teacherDetails.phone": 1,
          "teacherDetails.address": 1,
          "teacherDetails.image": 1,
        },
      },
    ]);

    // If no teachers found
    if (!teachers || teachers.length === 0) {
      return res.status(404).json({ message: "No teachers found" });
    }

    res.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Update a teacher
const updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address } = req.body;

  try {
    // Update User details
    const teacher = await Teacher.findById(id).populate("userId");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const user = await User.findById(teacher.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    // Update Teacher profile
    teacher.phone = phone || teacher.phone;
    teacher.address = address || teacher.address;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      teacher.image = result.secure_url;
    }

    await teacher.save();
    res.json({ message: "Teacher updated successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a teacher
const deleteTeacher = async (req, res) => {
  const { id } = req.params;
  console.log("Delete Request Received for ID:", id);

  try {
    // Find the teacher
    const teacher = await Teacher.findById(id);
    console.log("Found Teacher:", teacher);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Delete the associated User if it exists
    if (teacher.userId) {
      await User.findByIdAndDelete(teacher.userId);
    }

    // Delete the teacher
    await Teacher.findByIdAndDelete(id);
    console.log("Teacher Deleted Successfully");

    res.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Error deleting teacher" });
  }
};


const ApprovedTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    teacher.isApproved = req.body.isApproved;
    await teacher.save();

    res.status(200).json({ message: "Teacher approval status updated successfully", teacher });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

const ApprovedTeacherGet = async (req, res) => {
  try {
      const teachers = await Teacher.find().populate('userId', 'name email');;
      res.json(teachers);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
  }
}


module.exports = { addTeacher, getTeachers, updateTeacher, deleteTeacher, ApprovedTeacher, ApprovedTeacherGet};