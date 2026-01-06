// middleware.js
const { verifyToken } = require('./utils/jwt');
const User = require('./models/users');

async function isLoggedIn(req, res, next) {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            req.flash('error', 'Please login first');
            return res.redirect('/login');
        }
        
        const decoded = verifyToken(token);
        
        if (!decoded) {
            req.flash('error', 'Session expired. Please login again');
            res.clearCookie('token');
            return res.redirect('/login');
        }
        
        const user = await User.findById(decoded.userId)
            .populate('village')
            .select('-password');
        
        if (!user) {
            req.flash('error', 'User not found');
            res.clearCookie('token');
            return res.redirect('/login');
        }

        if (!user.isActive) {
            req.flash('error', 'Your account has been deactivated');
            res.clearCookie('token');
            return res.redirect('/login');
        }
        
        req.user = user;
        res.locals.currentUser = user;
        next();
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        req.flash('error', 'Authentication failed');
        res.redirect('/login');
    }
}

// Helper function to check if user is authenticated (for views)
function isAuthenticated(req) {
    return !!(req.cookies.token && req.user);
}

module.exports = { isLoggedIn, isAuthenticated };