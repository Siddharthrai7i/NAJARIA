const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/users');
const Village = require('../models/village');

// Signup Page
router.get('/signup', async (req, res) => {
    try {
        const villages = await Village.find().sort({ name: 1 });
        res.render('users/signup.ejs', { villages });
    } catch (err) {
        console.error('Error fetching villages:', err);
        req.flash('error', 'Error loading registration page');
        res.redirect('/');
    }
});

// Signup Post
router.post('/signup', async (req, res, next) => {
    try {
        const { username, email, fullName, phoneNumber, village, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            req.flash('error', 'Passwords do not match');
            return res.redirect('/signup');
        }
        
        const existingEmail = await User.findOne({ email: email });
        if (existingEmail) {
            req.flash('error', 'Email already registered');
            return res.redirect('/signup');
        }

        const newUser = new User({
            username: username,
            email: email,
            fullName: fullName,
            phoneNumber: phoneNumber,
            village: village
        });

        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        
        req.login(registeredUser, (err) => {
            if (err) {
                console.error(err);
                req.flash('error', 'Registration successful but login failed');
                return res.redirect('/login');
            }
            req.flash('success', `Welcome to the community, ${registeredUser.fullName}!`);
            res.redirect('/villages/my-village');
        });

    } catch (err) {
        console.error(err);
        if (err.name === 'UserExistsError') {
            req.flash('error', 'Username already taken');
        } else {
            req.flash('error', 'Registration failed. Please try again.');
        }
        res.redirect('/signup');
    }
});

// Login Page
router.get('/login', (req, res) => {
    res.render('users/login.ejs');
});

// Login Post
router.post('/login', 
    passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true,
    }), 
    (req, res) => {
        req.flash('success', 'Welcome back!');
        res.redirect('/villages/my-village');
    }
);

// Logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }    
        req.flash('success', "Logged out successfully");
        res.redirect('/');
    });
});

module.exports = router;