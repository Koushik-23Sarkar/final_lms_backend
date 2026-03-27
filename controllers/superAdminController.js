const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SuperAdmin = require('../models/SuperAdmin');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const crypto = require('crypto');

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
        const existingAdmin = await User.findOne({
            tenantId: tenant._id,
            role: 'SCHOOL_ADMIN'
        });
        let temporaryPassword = null;
        if (!existingAdmin) {
            temporaryPassword = crypto.randomBytes(4).toString('hex');
            await User.create({
                tenantId: tenant._id,
                role: 'SCHOOL_ADMIN',
                email: tenant.contactEmail,
                password: temporaryPassword,
                firstName: 'School',
                lastName: 'Admin'
            });
            console.log('\n--- EMAIL SIMULATION ---');
            console.log(`To: ${tenant.contactEmail}`);
            console.log(`Subject: Your LMS Portal is Ready!`);
            console.log(`URL: http://${tenant.slug}.yourlms.com`);
            console.log(`Email: ${tenant.contactEmail}`);
            console.log(`Temporary Password: ${temporaryPassword}`);
            console.log('------------------------\n');
        }
        res.status(200).json({
            success: true,
            message: 'Institution activated and Admin created.',
            data: tenant
        });
    } catch (error) {
        console.error("Approval Error:", error);
        res.status(500).json({ success: false, error: 'Failed to approve tenant' });
    }
};
