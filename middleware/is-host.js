module.exports = (req, res, next) => {
    if (!req.user || req.user.userType !== 'host') {
        // Handle AJAX/API requests
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(403).json({ error: 'Access denied. Only hosts can perform this action.' });
        }
        // Handle standard browser requests
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'You do not have permission to access this resource. Host privileges are required.'
        });
    }
    next();
};
