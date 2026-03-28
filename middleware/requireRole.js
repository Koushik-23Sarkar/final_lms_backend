
const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Please log in to continue.'
        });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: `Access denied. This action requires role: ${allowedRoles.join(' or ')}.`,
            yourRole: req.user.role
        });
    }

    return next();
};

module.exports = requireRole;
