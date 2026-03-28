const User = require('../models/User');
const Tenant = require('../models/Tenant');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const csv = require('csv-parser');
const stream = require('stream');


exports.getTenantInfo = async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.tenantId).select('name slug branding status');
        if (!tenant) return res.status(404).json({ success: false, error: 'Institution not found.' });
        res.status(200).json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch institution branding' });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, tenantId: req.tenantId });

        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
        }

        let passwordValid = false;
        const looksHashed = user.password.startsWith('$2');
        if (looksHashed) {
            passwordValid = await user.comparePassword(password);
        } else {
            passwordValid = (password === user.password);
            if (passwordValid) {
                user.password = password;
                await user.save();
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ success: false, error: 'Invalid email or password.' });
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
        console.error(error);
        res.status(500).json({ success: false, error: 'Server authentication error' });
    }
};


exports.getStudents = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { tenantId: req.tenantId, role: 'STUDENT' };
        if (search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { classGroup: regex }, { rollNumber: regex }];
        }

        const [students, total] = await Promise.all([
            User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: students,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.createStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, classGroup, rollNumber } = req.body;

        const existing = await User.findOne({ email, tenantId: req.tenantId });
        if (existing) return res.status(400).json({ error: 'A user with this email already exists.' });

        const tempPassword = crypto.randomBytes(4).toString('hex');

        const student = await User.create({
            tenantId: req.tenantId,
            role: 'STUDENT',
            firstName, lastName, email,
            password: tempPassword,
            classGroup: classGroup || null,
            rollNumber: rollNumber || null
        });

        res.status(201).json({
            success: true,
            data: { _id: student._id, firstName, lastName, email },
            tempPassword
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.updateStudent = async (req, res) => {
    try {
        const { firstName, lastName, email, classGroup, rollNumber, password } = req.body;
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (classGroup !== undefined) updateData.classGroup = classGroup;
        if (rollNumber !== undefined) updateData.rollNumber = rollNumber;

        if (password) {
            const student = await User.findOne({ _id: req.params.id, tenantId: req.tenantId, role: 'STUDENT' });
            if (!student) return res.status(404).json({ error: 'Student not found.' });
            Object.assign(student, updateData);
            student.password = password;
            await student.save();
            return res.status(200).json({ success: true, data: student });
        }

        const student = await User.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId, role: 'STUDENT' },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) return res.status(404).json({ error: 'Student not found.' });
        res.status(200).json({ success: true, data: student });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.deleteStudent = async (req, res) => {
    try {
        const student = await User.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId, role: 'STUDENT' });
        if (!student) return res.status(404).json({ success: false, error: 'Student not found.' });
        res.status(200).json({ success: true, message: 'Student removed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};


exports.bulkCreateStudents = (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a CSV file.' });

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream.pipe(csv()).on('data', (data) => {
        const clean = {};
        for (const key in data) clean[key.trim()] = data[key].trim();
        results.push(clean);
    }).on('end', async () => {
        try {
            const usersToInsert = results.map(row => ({
                tenantId: req.tenantId,
                role: 'STUDENT',
                firstName: row.FirstName || row.firstname || 'Unknown',
                lastName: row.LastName || row.lastname || '',
                email: row.Email || row.email,
                password: crypto.randomBytes(4).toString('hex'), // hashed by pre-save via insertMany+validate trick
                classGroup: row.Class || row.classGroup || null,
                rollNumber: row.RollNumber || row.rollNumber || null
            }));

            const valid = usersToInsert.filter(u => !!u.email);

            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            for (const u of valid) {
                u.password = await bcrypt.hash(u.password, salt);
            }

            const inserted = await User.insertMany(valid, { ordered: false }).catch(err => {
                if (err.code === 11000) return err.insertedDocs || [];
                throw err;
            });

            res.status(201).json({
                success: true,
                message: `${inserted.length} students imported successfully.`,
                count: inserted.length
            });
        } catch (error) {
            res.status(500).json({ success: false, error: 'Failed to process CSV data.' });
        }
    });
};

exports.getTeachers = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { tenantId: req.tenantId, role: 'TEACHER' };
        if (search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }];
        }

        const [teachers, total] = await Promise.all([
            User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: teachers,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.createTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email } = req.body;

        const existing = await User.findOne({ email, tenantId: req.tenantId });
        if (existing) return res.status(400).json({ error: 'A user with this email already exists.' });

        const tempPassword = crypto.randomBytes(4).toString('hex');

        const teacher = await User.create({
            tenantId: req.tenantId,
            role: 'TEACHER',
            firstName, lastName, email,
            password: tempPassword
        });

        res.status(201).json({
            success: true,
            data: { _id: teacher._id, firstName, lastName, email },
            tempPassword
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateTeacher = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const updateData = {};
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;

        if (password) {
            const teacher = await User.findOne({ _id: req.params.id, tenantId: req.tenantId, role: 'TEACHER' });
            if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
            Object.assign(teacher, updateData);
            teacher.password = password;
            await teacher.save();
            return res.status(200).json({ success: true, data: teacher });
        }

        const teacher = await User.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId, role: 'TEACHER' },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
        res.status(200).json({ success: true, data: teacher });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await User.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId, role: 'TEACHER' });
        if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
        res.status(200).json({ success: true, message: 'Teacher removed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.getParents = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { tenantId: req.tenantId, role: 'PARENT' };
        if (search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ firstName: regex }, { lastName: regex }, { email: regex }, { phone: regex }];
        }

        const [parents, total] = await Promise.all([
            User.find(query)
                .select('-password')
                .populate({ path: 'children', select: 'firstName lastName email classGroup rollNumber' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            data: parents,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.createParent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, childrenIds } = req.body;

        const existing = await User.findOne({ email, tenantId: req.tenantId });
        if (existing) return res.status(400).json({ error: 'A user with this email already exists.' });

        let validChildren = [];
        if (childrenIds && childrenIds.length > 0) {
            const students = await User.find({
                _id: { $in: childrenIds },
                tenantId: req.tenantId,
                role: 'STUDENT'
            }).select('_id');
            validChildren = students.map(s => s._id);
        }

        const tempPassword = crypto.randomBytes(4).toString('hex');

        const parent = await User.create({
            tenantId: req.tenantId,
            role: 'PARENT',
            firstName, lastName, email,
            phone: phone || null,
            password: tempPassword,
            children: validChildren
        });

        res.status(201).json({
            success: true,
            data: { _id: parent._id, firstName, lastName, email, phone },
            tempPassword
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.updateParent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, childrenIds } = req.body;
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;

        if (childrenIds !== undefined) {
            if (childrenIds.length > 0) {
                const students = await User.find({
                    _id: { $in: childrenIds },
                    tenantId: req.tenantId,
                    role: 'STUDENT'
                }).select('_id');
                updateData.children = students.map(s => s._id);
            } else {
                updateData.children = [];
            }
        }

        if (password) {
            const parent = await User.findOne({ _id: req.params.id, tenantId: req.tenantId, role: 'PARENT' });
            if (!parent) return res.status(404).json({ error: 'Parent not found.' });
            Object.assign(parent, updateData);
            parent.password = password;
            await parent.save();
            return res.status(200).json({ success: true, data: parent });
        }

        const parent = await User.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId, role: 'PARENT' },
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password').populate({ path: 'children', select: 'firstName lastName email classGroup' });

        if (!parent) return res.status(404).json({ error: 'Parent not found.' });
        res.status(200).json({ success: true, data: parent });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.deleteParent = async (req, res) => {
    try {
        const parent = await User.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId, role: 'PARENT' });
        if (!parent) return res.status(404).json({ error: 'Parent not found.' });
        res.status(200).json({ success: true, message: 'Parent removed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

