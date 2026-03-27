const jwt = require('jsonwebtoken');

const superAdminAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'SUPERADMIN') {
            return res.status(403).json({ success: false, error: 'Forbidden. Superadmin access only.' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
};

module.exports = superAdminAuth;
