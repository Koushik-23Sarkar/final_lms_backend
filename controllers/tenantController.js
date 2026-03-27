const Tenant = require('../models/Tenant');

exports.registerTenant = async (req, res) => {
    try {
        const { name, slug, type, contactEmail, contactPhone, logoUrl, primaryColor } = req.body;

        const existingTenant = await Tenant.findOne({ slug });
        if (existingTenant) {
            return res.status(400).json({ success: false, error: 'This school slug is already taken' });
        }

        const tenant = await Tenant.create({
            name,
            slug,
            type,
            contactEmail,
            contactPhone,
            branding: {
                logoUrl: logoUrl || null,
                primaryColor: primaryColor || '#10b981'
            },
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Institution registered successfully. Awaiting approval.',
            data: tenant
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error registering institution' });
    }
};
