const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');

exports.getTenantInfo = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.tenantId).select('name slug branding status');

        if (!tenant) {
            return res.status(404).json({ success: false, error: 'Institution not found.' });
        }

        res.status(200).json({
            success: true,
            data: tenant
        });
    } catch (error) {
        console.error("Error fetching tenant info:", error);
        res.status(500).json({ success: false, error: 'Failed to fetch institution branding' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, tenantId: req.tenantId });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password for this institution.' });
        }

        if (password !== user.password) {
            return res.status(401).json({ success: false, error: 'Invalid email or password for this institution.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, tenantId: req.tenantId },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            token,
            user: { _id: user._id, role: user.role, email: user.email, firstName: user.firstName }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server authentication error' });
    }
};

exports.createStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email, tenantId: req.tenantId });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists in this institution' });
        }

        const student = await User.create({
            tenantId: req.tenantId,
            role: 'STUDENT',
            firstName,
            lastName,
            email,
            password
        });

        res.status(201).json({ success: true, data: { _id: student._id, firstName, lastName, email } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({
            tenantId: req.tenantId,
            role: 'STUDENT'
        }).select('-password');

        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findOneAndDelete({
            _id: req.params.id,
            tenantId: req.tenantId,
            role: 'STUDENT'
        });

        if (!student) {
            return res.status(404).json({ success: false, error: 'Student not found in this institution' });
        }

        res.status(200).json({ success: true, data: student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
