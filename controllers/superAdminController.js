const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/SuperAdmin');
const Tenant = require('../models/Tenant');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const admin = await SuperAdmin.findOne({ email });

        if (!admin || admin.password !== password) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Login failed' });
    }
};

exports.getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tenants });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch tenants' });
    }
};

exports.approveTenant = async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(
            req.params.id,
            { status: 'active' },
            { new: true }
        );

        if (!tenant) return res.status(404).json({ success: false, error: 'Tenant not found' });

        // NOTE: Later, this is sending an automated email to the school owner saying "Your LMS is ready!"

        res.status(200).json({ success: true, message: 'Institution activated successfully.', data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to approve tenant' });
    }
};
