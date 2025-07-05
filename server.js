const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bodyParser = require('body-parser');
const connectDB = require('./config/db.js');

const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes.js");
const attendanceRoutes = require("./routes/attendanceRoutes.js");
const userRoutes = require("./routes/userRoutes.js")

dotenv.config();
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
 



connectDB(); 

app.use('/api/auth', authRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api", studentRoutes);
app.use("/api/", attendanceRoutes);
app.use("/api/admin",userRoutes )


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port soft WebMission ${PORT}`));
