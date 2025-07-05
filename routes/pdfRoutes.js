const PDFDocument = require('pdfkit');
const express = require('express');
const router = express.Router();

router.get('/generate-id/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findOne({ userId: studentId }).populate('userId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const doc = new PDFDocument();
    const filename = `${student.userId.name.replace(' ', '_')}_ID_Card.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.fontSize(20).text('Student ID Card', { align: 'center' });
    doc.moveDown();

    doc.fontSize(16).text(`Name: ${student.userId.name}`);
    doc.text(`Class: ${student.className}`);
    doc.text(`Roll Number: ${student.rollNumber}`);

    // QR Code
    const qrData = JSON.stringify({ studentId: student.userId._id });
    const QRCode = require('qrcode');
    const qrImageBuffer = await QRCode.toBuffer(qrData);

    doc.image(qrImageBuffer, { fit: [100, 100], align: 'center' });

    doc.pipe(res);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error generating ID card', error });
  }
});

module.exports = router;
