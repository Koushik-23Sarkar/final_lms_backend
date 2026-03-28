const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    role: { type: String, enum: ['STUDENT', 'TEACHER', 'SCHOOL_ADMIN', 'PARENT'], required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    classGroup: { type: String },
    rollNumber: { type: String },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    phone: { type: String },
}, { timestamps: true });


userSchema.index({ email: 1, tenantId: 1 }, { unique: true });


userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

