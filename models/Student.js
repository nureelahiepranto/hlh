const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },  
  });

  // Virtual field to get student's name from the User model
studentSchema.virtual("studentName", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
  options: { select: "name" }, // Fetch only the name field
});
// Auto-update `feesPaid` when a new fee payment is made

  
  module.exports = mongoose.model('Student', studentSchema);
  

// const mongoose = require('mongoose');

// const studentSchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     className: { type: String, required: true },
//     rollNumber: { type: String, required: true },
//     parentEmail: { type: String, required: true },
//     phone: { type: String, required: true },
//     feesPaid: { type: Number, default: 0 }, // Tracks total fees paid
//   });

//   // Virtual field to get student's name from the User model
// studentSchema.virtual("studentName", {
//   ref: "User",
//   localField: "userId",
//   foreignField: "_id",
//   justOne: true,
//   options: { select: "name" }, // Fetch only the name field
// });
  
//   module.exports = mongoose.model('Student', studentSchema);
  