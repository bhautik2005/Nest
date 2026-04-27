const User = require('../modals/user');

module.exports = async (req, res, next) => {
    // Make session data available in all views natively
    res.locals.isLoggedIn = req.session.isLoggedIn || false;
    res.locals.userType = req.session.user ? req.session.user.userType : null;

    if (!req.session.user) {
        return next();
    }
    
    try {
        const user = await User.findById(req.session.user._id);
        if (!user) {
            return next();
        }
        req.user = user;
        req.isLoggedIn = true;
        res.locals.user = user; // Make user available in all views
        next();
    } catch (err) {
        console.error("Error fetching user in middleware:", err);
        next(err);
    }
};
