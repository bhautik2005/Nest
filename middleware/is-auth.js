module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn) {
        // Handle AJAX/API requests
        if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
            return res.status(401).json({ error: 'Not authenticated. Please login first.' });
        }
        // Handle standard browser requests
        return res.redirect('/login');
    }
    next();
};
