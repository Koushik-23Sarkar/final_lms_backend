const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const csv = require('csv-parser');
const fs = require('fs');

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

        const tempPassword = password || crypto.randomBytes(4).toString('hex');

        const student = await User.create({
            tenantId: req.tenantId,
            role: 'STUDENT',
            firstName,
            lastName,
            email,
            password: tempPassword,
            classGroup: req.body.classGroup || null,
            rollNumber: req.body.rollNumber || null
        });

        res.status(201).json({ success: true, data: { _id: student._id, firstName, lastName, email }, tempPassword });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.bulkCreateStudents = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Please upload a CSV file.' });
    }

    const results = [];
    const errors = [];

    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => {
            const cleanData = {};
            for (const key in data) {
                cleanData[key.trim()] = data[key].trim();
            }
            results.push(cleanData);
        })
        .on('end', async () => {
            try {
                const usersToInsert = results.map((row) => {
                    const tempPassword = crypto.randomBytes(4).toString('hex');
                    return {
                        tenantId: req.tenantId,
                        role: 'STUDENT',
                        firstName: row.FirstName || row.firstname || 'Unknown',
                        lastName: row.LastName || row.lastname || '',
                        email: row.Email || row.email,
                        password: tempPassword,
                        classGroup: row.Class || row.classGroup || null,
                        rollNumber: row.RollNumber || row.rollNumber || null
                    };
                });

                const validUsers = usersToInsert.filter(u => !!u.email);

                const inserted = await User.insertMany(validUsers, { ordered: false });

                res.status(201).json({
                    success: true,
                    message: `${inserted.length} students imported successfully.`,
                    count: inserted.length
                });
            } catch (error) {
                if (error.code === 11000) {
                    const currentCount = error.insertedDocs ? error.insertedDocs.length : 0;
                    return res.status(201).json({
                        success: true,
                        message: `Import completed with some duplicate email skipping. ${currentCount} new students added.`
                    });
                }
                res.status(500).json({ success: false, error: 'Failed to process CSV data.' });
            }
        });
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

exports.getTeachers = async (req, res) => {
    try {
        const teachers = await User.find({
            tenantId: req.tenantId,
            role: 'TEACHER'
        }).select('-password');

        res.status(200).json({ success: true, data: teachers });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email, tenantId: req.tenantId });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists in this institution' });
        }

        const tempPassword = password || crypto.randomBytes(4).toString('hex');

        const teacher = await User.create({
            tenantId: req.tenantId,
            role: 'TEACHER',
            firstName,
            lastName,
            email,
            password: tempPassword,
        });

        res.status(201).json({ success: true, data: { _id: teacher._id, firstName, lastName, email }, tempPassword });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await User.findOneAndDelete({
            _id: req.params.id,
            tenantId: req.tenantId,
            role: 'TEACHER'
        });

        if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
        res.status(200).json({ success: true, message: 'Teacher deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
