const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    name: { type: String, required: true },
    description: { type: String },
}, { timestamps: true });




const batchSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Program',
        required: true
    },
    name: { type: String, required: true },
    academicYear: { type: String },
    classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });



const subjectSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    name: { type: String, required: true },
    subjectTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subjectType: { type: String, enum: ['CORE', 'ELECTIVE'], default: 'CORE' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = {
    Program: mongoose.model('Program', programSchema),
    Batch: mongoose.model('Batch', batchSchema),
    Subject: mongoose.model('Subject', subjectSchema)
}