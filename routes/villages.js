const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware.js');
const User = require('../models/users.js');
const Village = require('../models/village.js');
const Post = require('../models/posts.js');

// My Village (User's own village)
router.get('/my-village', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('village');
        if (!user || !user.village) {
            req.flash('error', 'Village not found');
            return res.redirect('/');
        }

        const villageMembers = await User.find({ village: user.village._id })
            .select('fullName username email phoneNumber createdAt')
            .sort({ createdAt: -1 });

        const villageInfo = await Village.findById(user.village._id)
            .populate('lagion', 'fullName username email');

        const posts = await Post.find({ village: user.village._id })
            .populate('author', 'fullName username')
            .populate('comments.user', 'fullName username')
            .sort({ createdAt: -1 });

        res.render('village.ejs', {
            village: villageInfo,
            members: villageMembers,
            posts: posts,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching village info:', error);
        req.flash('error', 'Error loading village information');
        res.redirect('/');
    }
});

// All Villages
router.get('/all', async (req, res) => {
    try {
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

        res.render('allvillages.ejs', { villagesWithData });
    } catch (error) {
        console.error('Error fetching villages:', error);
        req.flash('error', 'Error loading villages');
        res.redirect('/');
    }
});

// View specific village details (for non-members)
router.get('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const village = await Village.findById(id)
            .populate('lagion', 'fullName username email');
        
        if (!village) {
            req.flash('error', 'Village not found');
            return res.redirect('/villages/all');
        }

        const members = await User.find({ village: id })
            .select('fullName username email phoneNumber createdAt')
            .sort({ createdAt: -1 });

        const postCount = await Post.countDocuments({ village: id });

        res.render('villageinfo.ejs', {
            village: village,
            members: members,
            postCount: postCount,
            currentUser: req.user || null
        });
    } catch (error) {
        console.error('Error fetching village details:', error);
        req.flash('error', 'Error loading village details');
        res.redirect('/villages/all');
    }
});

// View specific village posts (for non-members - read only)
router.get('/:id/posts', async (req, res) => {
    try {
        const { id } = req.params;
        const village = await Village.findById(id);
        
        if (!village) {
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

        res.render('villageinside.ejs', {
            posts: posts,
            village: village,
            currentUser: req.user || null,
            isMember: isMember
        });
    } catch (error) {
        console.error('Error fetching village posts:', error);
        req.flash('error', 'Error loading posts');
        res.redirect('/villages/all');
    }
});

// View specific post from a village
router.get('/:villageId/post/:postId', async (req, res) => {
    try {
        const { villageId, postId } = req.params;
        
        const post = await Post.findById(postId)
            .populate('author', 'fullName username email')
            .populate('comments.user', 'fullName username')
            .populate('village', 'name');

        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/villages/all');
        }

        // Check if user is member of this village
        let isMember = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            isMember = user && user.village.toString() === villageId;
        }

        res.render('villageinsidepost.ejs', {
            posts: post,
            currentUser: req.user || null,
            isMember: isMember,
            village: post.village
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        req.flash('error', 'Error loading post');
        res.redirect('/villages/all');
    }
});

module.exports = router;