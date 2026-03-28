const { Program, Batch, Subject } = require('../models/Academic');


exports.createProgram = async (req, res) => {
    try {
        const program = await Program.create({
            tenantId: req.tenantId,
            name: req.body.name,
            description: req.body.description
        })
        res.status(201).json({ success: true, program })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, error: error.message })
    }
}

exports.createBatch = async (req, res) => {
    try {
        const batch = await Batch.create({
            tenantId: req.tenantId,
            programId: req.body.programId,
            name: req.body.name,
            academicYear: req.body.academicYear,
            classTeacherId: req.body.classTeacherId || null
        });
        res.status(201).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.createSubject = async (req, res) => {
    try {
        const { batchId, name, subjectTeacherId, subjectType } = req.body;

        let initialStudents = [];
        if (subjectType === 'CORE') {
            const batch = await Batch.findById(batchId);
            if (batch) initialStudents = batch.students || [];
        }
        const subject = await Subject.create({
            tenantId: req.tenantId,
            batchId,
            name,
            subjectTeacherId: subjectTeacherId || null,
            subjectType: subjectType || 'CORE',
            students: initialStudents
        });

        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getHierarchy = async (req, res) => {
    try {
        const programs = await Program.find({ tenantId: req.tenantId });
        const batches = await Batch.find({ tenantId: req.tenantId });
        const subjects = await Subject.find({ tenantId: req.tenantId });

        const tree = programs.map(prog => {
            const progBatches = batches
                .filter(b => b.programId.toString() === prog._id.toString())
                .map(batch => {
                    const batchSubjects = subjects.filter(s => s.batchId.toString() === batch._id.toString());
                    return {
                        ...batch.toObject(),
                        subjects: batchSubjects
                    };
                });

            return { ...prog.toObject(), batches: progBatches };
        });
        res.status(200).json({ success: true, data: tree });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, error: error.message });
    }
}


exports.updateBatchRoster = async (req, res) => {
    try {
        const batch = await Batch.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            { students: req.body.studentIds },
            { new: true }
        );
        res.status(200).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateSubjectRoster = async (req, res) => {
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, tenantId: req.tenantId },
            { students: req.body.studentIds },
            { new: true }
        );
        res.status(200).json({ success: true, data: subject });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteProgram = async (req, res) => {
    try {
        await Program.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
        res.status(200).json({ success: true, message: 'Program deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteBatch = async (req, res) => {
    try {
        await Batch.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
        res.status(200).json({ success: true, message: 'Batch deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        await Subject.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
        res.status(200).json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


exports.getTeacherDashboard = async (req, res) => {
    try {
        const subjects = await Subject.find({
            tenantId: req.tenantId,
            subjectTeacherId: req.user.id
        }).populate('batchId', 'name academicYear');

        const formatted = subjects.map(s => ({
            _id: s._id,
            name: s.name,
            subjectType: s.subjectType,
            students: s.students || [],
            batchName: s.batchId ? s.batchId.name : 'Unknown'
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStudentDashboard = async (req, res) => {
    try {
        const subjects = await Subject.find({
            tenantId: req.tenantId,
            students: req.user.id
        }).populate('subjectTeacherId', 'firstName lastName');

        const formatted = subjects.map(s => ({
            _id: s._id,
            name: s.name,
            subjectType: s.subjectType,
            teacherName: s.subjectTeacherId ? `${s.subjectTeacherId.firstName} ${s.subjectTeacherId.lastName}` : 'Unassigned'
        }));

        res.status(200).json({ success: true, data: formatted });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

