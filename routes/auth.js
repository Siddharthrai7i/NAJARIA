// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { isLoggedIn } = require('../middleware');
const User = require('../models/users');
const Village = require('../models/village');

// ✅ Signup Page - GET
router.get('/signup', async (req, res) => {
    try {
        if (req.cookies.token && req.user) {
            return res.redirect('/posts');
        }
        
        const villages = await Village.find().sort({ name: 1 });
        res.render('users/signup.ejs', { villages });
    } catch (err) {
        console.error('Error fetching villages:', err);
        req.flash('error', 'Error loading registration page');
        res.redirect('/');
    }
});

// ✅ Signup POST
router.post('/signup', async (req, res) => {
    try {
        const { username, email, fullName, phoneNumber, village, password, confirmPassword } = req.body;
        
        if (!username || !email || !fullName || !phoneNumber || !village || !password || !confirmPassword) {
            req.flash('error', 'All fields are required');
            return res.redirect('/signup');
        }
        
        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/signup');
        }
        
        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters');
            return res.redirect('/signup');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash('error', 'Invalid email format');
            return res.redirect('/signup');
        }
        
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            req.flash('error', 'Email already registered');
            return res.redirect('/signup');
        }
        
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            req.flash('error', 'Username already taken');
            return res.redirect('/signup');
        }
        
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = await User.create({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            fullName: fullName.trim(),
            phoneNumber: phoneNumber.trim(),
            village: village,
            password: hashedPassword
        });
        
        console.log('✅ New user registered:', newUser.username);
        
        const token = generateToken(newUser._id);
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        req.flash('success', `Welcome to the community, ${newUser.fullName}!`);
        res.redirect('/posts');
        
    } catch (err) {
        console.error('❌ Signup error:', err);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect('/signup');
    }
});

// ✅ Login Page - GET
router.get('/login', (req, res) => {
    if (req.cookies.token && req.user) {
        return res.redirect('/posts');
    }
    res.render('users/login.ejs');
});

// ✅ Login POST
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            req.flash('error', 'Username and password are required');
            return res.redirect('/login');
        }
        
        const user = await User.findOne({ 
            username: username.toLowerCase() 
        }).populate('village');
        
        if (!user) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }
        
        if (!user.isActive) {
            req.flash('error', 'Your account has been deactivated');
            return res.redirect('/login');
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/login');
        }
        
        user.lastLogin = new Date();
        await user.save();
        
        const token = generateToken(user._id);
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        console.log('✅ User logged in:', user.username);
        req.flash('success', 'Welcome back!');
        res.redirect('/posts');
        
    } catch (err) {
        console.error('❌ Login error:', err);
        req.flash('error', 'Login failed. Please try again.');
        res.redirect('/login');
    }
});

// ✅ Logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
});

module.exports = router;