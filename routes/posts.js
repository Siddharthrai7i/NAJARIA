const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isLoggedIn } = require('../middleware.js');
const User = require('../models/users');
const Village = require('../models/village.js');
const Post = require('../models/posts.js');

// Multer Configuration for Image Upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/posts'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all posts of logged-in user's village (Home page after login)
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('village');
        if (!user || !user.village) {
            req.flash('error', 'You must belong to a village');
            return res.redirect('/');
        }

        const posts = await Post.find({ village: user.village._id })
            .populate('author', 'fullName username email')
            .populate('comments.user', 'fullName username')
            .populate('village', 'name')
            .sort({ createdAt: -1 });
        
        res.render('posts/index.ejs', {
            posts: posts,
            village: user.village,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        req.flash('error', 'Error loading posts');
        res.redirect('/villages/my-village');
    }
});

// New Post Form
router.get('/new', isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('village');
        if (!user || !user.village) {
            req.flash('error', 'You must belong to a village to create posts');
            return res.redirect('/');
        }
        res.render('posts/new.ejs', { village: user.village });
    } catch (error) {
        console.error('Error:', error);
        req.flash('error', 'Error loading form');
        res.redirect('/villages/my-village');
    }
});

// Create New Post (with optional image)
router.post('/', isLoggedIn, upload.single('image'), async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.village) {
            req.flash('error', 'You must belong to a village to create posts');
            return res.redirect('/');
        }

        const { title, content } = req.body;
        
        // Create post object
        const postData = {
            title: title,
            content: content,
            author: req.user._id,
            village: user.village
        };

        // Add image path if uploaded
        if (req.file) {
            postData.image = '/uploads/posts/' + req.file.filename;
        }

        const newPost = new Post(postData);

        await newPost.save();
        await Village.findByIdAndUpdate(
            user.village,
            { $push: { posts: newPost._id } }
        );

        req.flash('success', 'Post created successfully!');
        res.redirect('/posts');
    } catch (error) {
        console.error('Error creating post:', error);
        req.flash('error', 'Error creating post');
        res.redirect('/villages/my-village');
    }
});

// View Single Post
router.get('/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(req.user._id);
        const post = await Post.findById(id)
            .populate('author', 'fullName username email')
            .populate('comments.user', 'fullName username')
            .populate('village', 'name');
            
        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/villages/my-village');
        }

        // Check if user belongs to same village
        if (user.village.toString() !== post.village._id.toString()) {
            req.flash('error', 'You can only view posts from your village');
            return res.redirect('/villages/my-village');
        }

        res.render('posts/show.ejs', {
            post: post,
            currentUser: req.user
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        req.flash('error', 'Error loading post');
        res.redirect('/villages/my-village');
    }
});

// Add Comment
router.post('/:id/comment', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const post = await Post.findById(id);

        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/villages/my-village');
        }

        const user = await User.findById(req.user._id);
        if (user.village.toString() !== post.village.toString()) {
            req.flash('error', 'You can only comment on posts from your village');
            return res.redirect('/villages/my-village');
        }

        post.comments.push({
            user: req.user._id,
            content: content
        });

        await post.save();
        req.flash('success', 'Comment added!');
        res.redirect('/villages/my-village');
    } catch (error) {
        console.error('Error adding comment:', error);
        req.flash('error', 'Error adding comment');
        res.redirect('/villages/my-village');
    }
});

// Delete Post
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/villages/my-village');
        }

        if (post.author.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only delete your own posts');
            return res.redirect('/villages/my-village');
        }

        await Post.findByIdAndDelete(id);
        req.flash('success', 'Post deleted successfully');
        res.redirect('/posts');
    } catch (error) {
        console.error('Error deleting post:', error);
        req.flash('error', 'Error deleting post');
        res.redirect('/posts');
    }
});

module.exports = router;