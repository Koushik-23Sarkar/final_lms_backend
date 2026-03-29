const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    domain: { type: String, default: null },
    type: { type: String, enum: ['school', 'college', 'coaching'], required: true },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    branding: {
        logoUrl: { type: String, default: null },
        primaryColor: { type: String, default: '#10b981' }, 
    },
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    settings: {
        academicYear: { type: String },
        brandingColor: { type: String, default: '#3B82F6' },
        logoUrl: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
