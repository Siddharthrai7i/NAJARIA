// routes/villages.js (Updated with Better Logging)
const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');
const User = require('../models/users.js');
const Village = require('../models/village.js');
const Post = require('../models/posts.js');

// My Village (User's own village)
router.get('/my-village', isLoggedIn, async (req, res) => {
    try {
        console.log('📍 Accessing /my-village');
        console.log('👤 User ID:', req.user._id);
        console.log('🏘️  User village:', req.user.village);
        
        const user = await User.findById(req.user._id).populate('village');
        
        if (!user) {
            console.log('❌ User not found');
            req.flash('error', 'User not found');
            return res.redirect('/');
        }
        
        if (!user.village) {
            console.log('❌ User has no village assigned');
            req.flash('error', 'You are not assigned to any village');
            return res.redirect('/');
        }

        console.log('✅ User village found:', user.village.name);

        const villageMembers = await User.find({ village: user.village._id })
            .select('fullName username email phoneNumber createdAt')
            .sort({ createdAt: -1 });

        const villageInfo = await Village.findById(user.village._id)
            .populate('lagion', 'fullName username email');

        const posts = await Post.find({ village: user.village._id })
            .populate('author', 'fullName username')
            .populate('comments.user', 'fullName username')
            .sort({ createdAt: -1 });

        console.log('✅ Rendering village page with', posts.length, 'posts');

        res.render('village.ejs', {
            village: villageInfo,
            members: villageMembers,
            posts: posts,
            currentUser: req.user
        });
    } catch (error) {
        console.error('❌ Error in /my-village:', error);
        console.error('Error stack:', error.stack);
        req.flash('error', 'Error loading village information');
        res.redirect('/');
    }
});

// All Villages
router.get('/all', async (req, res) => {
    try {
        console.log('📍 Accessing /villages/all');
        
        const villages = await Village.find()
            .populate('lagion', 'fullName username')
            .sort({ name: 1 });

        const villagesWithData = await Promise.all(
            villages.map(async (village) => {
                const userCount = await User.countDocuments({ village: village._id });
                const members = await User.find({ village: village._id })
                    .select('fullName username')
                    .sort({ fullName: 1 });
                return {
                    village: village,
                    userCount: userCount,
                    members: members
                };
            })
        );

        console.log('✅ Found', villages.length, 'villages');

        res.render('allvillages.ejs', { villagesWithData });
    } catch (error) {
        console.error('❌ Error in /villages/all:', error);
        req.flash('error', 'Error loading villages');
        res.redirect('/');
    }
});

// View specific village details (for non-members)
router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📍 Accessing village details:', id);
        
        const village = await Village.findById(id)
            .populate('lagion', 'fullName username email');
        
        if (!village) {
            console.log('❌ Village not found:', id);
            req.flash('error', 'Village not found');
            return res.redirect('/villages/all');
        }

        const members = await User.find({ village: id })
            .select('fullName username email phoneNumber createdAt')
            .sort({ createdAt: -1 });

        const postCount = await Post.countDocuments({ village: id });
        let isMember = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            isMember = user && user.village.toString() === id;
        }

        console.log('✅ Village details loaded:', village.name);

        res.render('villageinfo.ejs', {
            village: village,
            members: members,
            postCount: postCount,
            isMember: isMember,
            currentUser: req.user || null
        });
    } catch (error) {
        console.error('❌ Error in /:id/details:', error);
        req.flash('error', 'Error loading village details');
        res.redirect('/villages/all');
    }
});

// View specific village posts (for non-members - read only)
router.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📍 Accessing village posts:', id);
        
        const village = await Village.findById(id);
        
        if (!village) {
            console.log('❌ Village not found:', id);
            req.flash('error', 'Village not found');
            return res.redirect('/villages/all');
        }

        const posts = await Post.find({ village: id })
            .populate('author', 'fullName username email')
            .populate('comments.user', 'fullName username')
            .populate('village', 'name')
            .sort({ createdAt: -1 });

        // Check if user is member of this village
        let isMember = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            isMember = user && user.village.toString() === id;
        }

        console.log('✅ Loaded', posts.length, 'posts for village:', village.name);

        res.render('villageinside.ejs', {
            posts: posts,
            village: village,
            currentUser: req.user || null,
            isMember: isMember
        });
    } catch (error) {
        console.error('❌ Error in /:id/posts:', error);
        req.flash('error', 'Error loading posts');
        res.redirect('/villages/all');
    }
});

// View specific post from a village
router.get('/:villageId/post/:postId', async (req, res) => {
    try {
        const { villageId, postId } = req.params;
        
        console.log('📍 Accessing post:', postId, 'from village:', villageId);
        
        const post = await Post.findById(postId)
            .populate('author', 'fullName username email')
            .populate('comments.user', 'fullName username')
            .populate('village', 'name');

        if (!post) {
            console.log('❌ Post not found:', postId);
            req.flash('error', 'Post not found');
            return res.redirect('/villages/all');
        }

        // Check if user is member of this village
        let isMember = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            isMember = user && user.village.toString() === villageId;
        }

        console.log('✅ Post loaded:', post.title || 'Untitled');

        res.render('villageinsidepost.ejs', {
            posts: post,
            currentUser: req.user || null,
            isMember: isMember,
            village: post.village
        });
    } catch (error) {
        console.error('❌ Error in /:villageId/post/:postId:', error);
        req.flash('error', 'Error loading post');
        res.redirect('/villages/all');
    }
});

module.exports = router;