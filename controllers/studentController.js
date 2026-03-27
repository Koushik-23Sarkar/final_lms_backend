const User = require('../models/User');

exports.getAllStudents = async (req, res) => {
    try {
        const students = await User.find({
            tenantId: req.tenantId,
            role: 'STUDENT'
        }).select('-password');

        res.status(200).json({ success: true, count: students.length, data: students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error Fetching Students' });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const newStudentData = {
            ...req.body,
            tenantId: req.tenantId,
            role: 'STUDENT'
        };

        const student = await User.create(newStudentData);
        res.status(201).json({ success: true, data: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database error adding student' });
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await User.findOne({
            _id: req.params.id,
            tenantId: req.tenantId,
            role: 'STUDENT'
        }).select('-password');

        if (!student) {
            return res.status(404).json({ success: false, error: 'Student not found in this institution' });
        }

        res.status(200).json({ success: true, data: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
