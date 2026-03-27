const Tenant = require('../models/Tenant');

const tenantMiddleware = async (req, res, next) => {
    try {
        const slug = req.headers['x-tenant-slug'];

        if (!slug) {
            return res.status(400).json({ error: 'Missing x-tenant-slug header. This route requires a subdomain.' });
        }
        const tenant = await Tenant.findOne({ slug });

        if (!tenant) {
            return res.status(404).json({ error: `Tenant identifier '${slug}' not found.` });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({ error: 'This institution account is currently inactive or pending approval.' });
        }

        req.tenantId = tenant._id;
        next();
    } catch (error) {
        console.error('Tenant Resolution Error:', error);
        res.status(500).json({ error: 'Failed to resolve tenant configuration.' });
    }
};

module.exports = tenantMiddleware;
