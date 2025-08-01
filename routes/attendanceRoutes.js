const express = require('express');
const router = express.Router();
const cron = require("node-cron");
const Attendance = require('../models/Attendance'); // Create an Attendance model
const Student = require('../models/Student.js');
const nodemailer = require("nodemailer");
const fs = require("fs");
// const { PDFDocument, StandardFonts } = require("pdf-lib");
const {  authMiddleware } = require('../middlewares/authMiddleware.js');
const verifyTeacher = require('../middlewares/verifyTeacher.js');
const PDFDocument = require("pdfkit");
const path = require("path");
require("dotenv").config();


router.post("/attendanceR", verifyTeacher, async (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).json({ success: false, message: "studentId is required." });
  }

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const now = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let attendance = await Attendance.findOne({
      studentId,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      attendance = new Attendance({
        studentId,
        date: now,
      });
    }

    const hour = now.getHours();
    const minute = now.getMinutes();

    // Morning slot: 9:00 - 10:00
    if ((hour === 9) || (hour === 10 && minute === 0)) {
      if (!attendance.presentStartTime) {
        attendance.presentStartTime = now;
        await attendance.save();
        return res.status(200).json({ success: true, message: "Morning attendance marked", data: attendance });
      } else {
        return res.status(400).json({ success: false, message: "Morning attendance already marked." });
      }
    }

    // Afternoon slot: 3:00 - 4:00
    if ((hour === 15) || (hour === 16 && minute === 0)) {
      if (!attendance.presentStartTime) {
        return res.status(400).json({
          success: false,
          message: "Morning attendance missing. Cannot mark afternoon attendance.",
        });
      }

      if (!attendance.afternoonAttendance) {
        attendance.afternoonAttendance = now;
        await attendance.save();
        return res.status(200).json({ success: true, message: "Afternoon attendance marked", data: attendance });
      } else {
        return res.status(400).json({ success: false, message: "Afternoon attendance already marked." });
      }
    }

    // Night slot: 9:00 - 10:00 PM
    if ((hour === 21) || (hour === 22 && minute === 0)) {
      if (!attendance.presentStartTime) {
        return res.status(400).json({
          success: false,
          message: "Morning attendance missing. Cannot mark night attendance.",
        });
      }

      if (!attendance.presentEndTime) {
        attendance.presentEndTime = now;
        await attendance.save();
        return res.status(200).json({ success: true, message: "Night attendance marked", data: attendance });
      } else {
        return res.status(400).json({ success: false, message: "Night attendance already marked." });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Current time does not fall in any attendance slot.9",
    });

  } catch (error) {
    console.error("Error marking attendance:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});


// router.post("/attendanceR", verifyTeacher, async (req, res) => {
//   const { studentId } = req.body;

//   if (!studentId ) {
//     return res.status(400).json({ success: false, message: "studentId are required." });
//   }

//   try {
//     // Validate student
//     const student = await Student.findOne({ _id: studentId });
//     if (!student) {
//       return res.status(404).json({ success: false, message: "Student not found with provided phone number." });
//     }

//     const now = new Date();

//     // Define today's date range
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);

//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     // Check if attendance exists for today
//     let attendance = await Attendance.findOne({
//       studentId,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     if (!attendance) {
//       // Step 1: Mark attendance start time (first check-in)
//       attendance = new Attendance({
//         studentId,
//         presentStartTime: now,
//         date: now,
//       });

//       await attendance.save();

//       return res.status(201).json({
//         success: true,
//         message: "Attendance start time marked successfully.",
//         data: attendance,
//       });
//     }

//     // Step 2: Mark attendance end time (second check-out)
//     if (!attendance.presentEndTime) {
//       attendance.presentEndTime = now;
//       await attendance.save();

//       return res.status(200).json({
//         success: true,
//         message: "Attendance end time marked successfully.",
//         data: attendance,
//       });
//     }

//     // Step 3: Already marked both start and end
//     return res.status(400).json({
//       success: false,
//       message: "Attendance already marked (start and end) for today.",
//     });

//   } catch (error) {
//     console.error("Error marking attendance:", error.message);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error while marking attendance.",
//       error: error.message,
//     });
//   }
// });



router.get("/studentsD", async (req, res) => {
  try {
    const students = await Student.find()
      .populate("userId", "name") // Populate the userId field with the name from the User collection
      .select("rollNumber className userId");

    const formattedStudents = students.map((student) => ({
      _id: student._id,
      rollNumber: student.rollNumber,
      className: student.className,
      name: student.userId?.name || "Unknown", // If no name is found, default to 'Unknown'
    }));

    res.status(200).json({ students: formattedStudents });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Failed to fetch students", error });
  }
});


// GET all student attendance data
router.get("/all", async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find().populate("studentId", "name rollNumber className");

    if (!attendanceRecords.length) {
      return res.status(404).json({ message: "No attendance records found" });
    }

    const formattedRecords = attendanceRecords.map((record) => ({
      id: record._id,
      studentId: record.studentId._id,
      name: record.studentId.name,
      rollNumber: record.studentId.rollNumber,
      className: record.studentId.className,
      date: record.date,
    }));

    res.status(200).json({ attendance: formattedRecords });
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ message: "Error fetching attendance data", error: error.message });
  }
});

router.get("/today", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const attendanceRecords = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("studentId", "name rollNumber className");

    const formattedRecords = attendanceRecords.map((record) => ({
      id: record._id,
      studentId: record.studentId._id,
      name: record.studentId.name,
      rollNumber: record.studentId.rollNumber,
      className: record.studentId.className,
      presentStartTime: record.presentStartTime,
      afternoonAttendance: record.afternoonAttendance, // ✅ included
      presentEndTime: record.presentEndTime,
    }));

    res.status(200).json({ attendance: formattedRecords });
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: "Failed to fetch today's attendance", error });
  }
});


// Setup Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// Function to send email to the parent
// const sendEmailToParent = (email, studentName) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Absence Notification",
//     text: `Dear Parent, your child, ${studentName}, was absent today. Please ensure they attend school regularly.`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error("Error sending email: ", error);
//     } else {
//       console.log(`Email sent to ${email}: ` + info.response);
//     }
//   });
// };

// Function to check absent students and send emails
const checkAbsentStudents = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to start of the day

    // Get all students with populated studentName (name from User model)
    const allStudents = await Student.find().populate({
      path: "userId",
      select: "name", // Only fetch the name field from the User model
    });

    // Get all students who marked attendance today
    const presentStudents = await Attendance.find({
      date: today,
    }).select("studentId");

    const presentStudentIds = presentStudents.map((attendance) =>
      attendance.studentId.toString()
    );

    // Find students who are absent
    const absentStudents = allStudents.filter(
      (student) => !presentStudentIds.includes(student._id.toString())
    );

    // Send email to absent students' parents
    for (let student of absentStudents) {
      if (student.parentEmail && student.userId?.name) {
        console.log(
          "Sending email to:",
          student.parentEmail,
          "for student:",
          student.userId.name
        ); // Debugging
        sendEmailToParent(student.parentEmail, student.userId.name);
      } else {
        console.warn(
          `Skipping student ${student._id}: parentEmail or name is missing.`
        );
      }
    }
    console.log("Absent student emails sent successfully.");
  } catch (error) {
    console.error("Error checking absent students:", error);
  }
};

// router.post("/test-send-absent-emails", async (req, res) => {
//   try {
//     await checkAbsentStudents(); // Call the function manually
//     res.status(200).json({ message: "Absent student emails sent successfully!" });
//   } catch (error) {
//     console.error("Error in testing absent student emails:", error);
//     res.status(500).json({ error: "Failed to send absent student emails." });
//   }
// });

// Schedule the job to run at 10:00 AM every day
cron.schedule("0 10 * * *", () => {
  console.log("Running absent student check at 10:00 AM...");
  checkAbsentStudents();
}, {
  timezone: "Asia/Dhaka" // Adjust the timezone if needed
});



// API to fetch attendance data for a specific date
// ✅ Fetch attendance data for a specific date
router.get("/api/attendance/:date", async (req, res) => {
  try {
    const selectedDate = new Date(req.params.date);
    selectedDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendanceData = await Attendance.find({
      date: { $gte: selectedDate, $lt: nextDay }
    })
      .populate({
        path: "studentId",
        select: "rollNumber userId className", // ✅ Include className
        populate: {
          path: "userId",
          model: "User",
          select: "name",
        },
      });

    res.status(200).json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    res.status(500).json({ error: "Failed to fetch attendance data" });
  }
});
// ✅ Generate and send PDF directly to the frontend
router.get("/api/attendance/download/:date", async (req, res) => {
  try {
    const selectedDate = new Date(req.params.date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendanceData = await Attendance.find({
      date: { $gte: selectedDate, $lt: nextDay }
    }).populate({
      path: "studentId",
      select: "userId",
      populate: {
        path: "userId",
        model: "User",
        select: "name",
      },
    });

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const filePath = path.join(__dirname, "Attendance_Report.pdf");
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 🔹 Branded Header
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .fillColor("green")
      .text("Holy Lab Hospital", { align: "center" });

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#2e86de")
      .text("Attendance Report", { align: "center" });


    doc
      .moveDown(0.3)
      .fontSize(12)
      .fillColor("black")
      .text(`Date: ${selectedDate.toDateString()}`, { align: "center" });

    doc.moveDown(1);

    // 🔹 Table Headers
    const tableTop = 150;
    const startX = 40;
    const colWidths = [200, 100, 100, 100];
    const headers = ["Name", "Start Time", "End Time", "Status"];

    doc.font("Helvetica-Bold").fontSize(11);
    doc.fillColor("#ffffff");
    doc.rect(startX, tableTop, colWidths.reduce((a, b) => a + b), 25).fill("#2e86de").stroke();

    let x = startX;
    headers.forEach((header, i) => {
      doc
        .fillColor("#ffffff")
        .text(header, x + 5, tableTop + 7, { width: colWidths[i], align: "center" });
      x += colWidths[i];
    });

    // 🔹 Table Rows
    let y = tableTop + 30;
    doc.font("Helvetica").fontSize(10);

    attendanceData.forEach((attendance, idx) => {
      x = startX;
      const rowHeight = 22;
      const isEvenRow = idx % 2 === 0;
      const fillColor = isEvenRow ? "#f1f3f4" : "#ffffff";

      doc.rect(x, y, colWidths.reduce((a, b) => a + b), rowHeight).fill(fillColor).stroke();
      doc.fillColor("black");

      const rowData = [
        attendance.studentId?.userId?.name || "N/A",
        attendance.presentStartTime ? new Date(attendance.presentStartTime).toLocaleTimeString() : "N/A",
        attendance.presentEndTime ? new Date(attendance.presentEndTime).toLocaleTimeString() : "N/A",
        "Present"
      ];

      rowData.forEach((data, i) => {
        doc.text(data, x + 5, y + 6, { width: colWidths[i], align: "center" });
        x += colWidths[i];
      });

      y += rowHeight;
    });

    // 🔹 Footer
    doc.moveDown(2);
    doc
      .fontSize(10)
      .fillColor("gray")
      .text("Generated by Soft WebMission", { align: "center" });

    doc.end();

    stream.on("finish", () => {
      res.download(filePath, "Attendance_Report.pdf", (err) => {
        if (err) {
          console.error("Download Error:", err);
          res.status(500).send("Download error.");
        }
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});




module.exports = router;