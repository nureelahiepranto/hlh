const User = require('../models/User');
const QRCode = require('qrcode');

exports.generateStudentIdCard = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const qrCodeData = await QRCode.toDataURL(userId);
        res.status(200).json({ name: user.name, userId: user._id, qrCode: qrCodeData });
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
};
