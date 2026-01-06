const express = require('express');
const app = express();
const http = require('http');
const socketIO = require('socket.io');
const path = require("path");
const ejsMate = require('ejs-mate');
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();

const MONGO_URL = process.env.MONGODB_URI ;
const ExpressError = require('./utils/ExpressError.js');
const { verifyToken } = require('./utils/jwt');
const User = require('./models/users.js');

// Import Routes
const authRoutes = require('./routes/auth.js');
const villageRoutes = require('./routes/villages.js');
const postRoutes = require('./routes/posts.js');
const messageRoutes = require('./routes/messages.js');

// Create HTTP Server for Socket.IO
const server = http.createServer(app);
const io = socketIO(server);

// Database Connection
main()
  .then(() => { console.log("✅ MongoDB connection successful") })
  .catch(err => console.log("❌ MongoDB connection error:", err));

async function main() {
  await mongoose.connect(MONGO_URL);
}

// View Engine Setup
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(cookieParser());

// Session Configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'mysecretcode',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));
app.use(flash());

// JWT Authentication Middleware
// JWT Authentication Middleware
app.use(async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    
    const token = req.cookies.token;
    if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
            try {
                const user = await User.findById(decoded.userId)
                    .populate('village')
                    .select('-password');
                res.locals.currentUser = user;
                req.user = user;
                
                // ⭐ YEH LINE ADD KAR - Debug ke liye
                console.log('User loaded:', user ? user.fullName : 'No user');
                
            } catch (err) {
                console.error('User fetch error:', err); // ⭐ YEH BHI ADD KAR
                res.locals.currentUser = null;
                req.user = null;
            }
        } else {
            res.locals.currentUser = null;
            req.user = null;
        }
    } else {
        res.locals.currentUser = null;
        req.user = null;
    }
    
    next();
});

// Make Socket.IO accessible to routes
app.set('io', io);

// ✅ Landing Page - MUST come BEFORE auth routes
app.get('/', (req, res) => {
    if (req.cookies.token && req.user) {
        return res.redirect('/posts');
    }
    res.render("landing.ejs");
});

// ✅ Routes - Correct Order
app.use('/', authRoutes);           // /login, /signup, /logout
app.use('/villages', villageRoutes); // /villages/*
app.use('/posts', postRoutes);       // /posts/*
app.use('/messages', messageRoutes); // /messages/*

// Socket.IO Authentication
io.use(async (socket, next) => {
    try {
        const cookies = socket.handshake.headers.cookie;
        
        if (!cookies) {
            return next(new Error('No cookies found'));
        }
        
        const token = cookies.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1];
        
        if (!token) {
            return next(new Error('No token found'));
        }
        
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return next(new Error('Invalid token'));
        }
        
        const user = await User.findById(decoded.userId).populate('village');
        
        if (!user) {
            return next(new Error('User not found'));
        }
        
        socket.userId = user._id.toString();
        socket.username = user.username;
        socket.fullName = user.fullName;
        socket.villageId = user.village._id.toString();
        
        next();
        
    } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication failed'));
    }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.fullName} (${socket.username})`);
    
    socket.on('join-conversation', (conversationId) => {
        socket.join(conversationId);
        console.log(`${socket.username} joined conversation: ${conversationId}`);
    });
    
    socket.on('typing', (data) => {
        socket.to(data.conversationId).emit('user-typing', {
            userId: socket.userId,
            username: socket.username,
            fullName: socket.fullName,
            isTyping: data.isTyping
        });
    });
    
    socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.username}`);
    });
});

// ✅ 404 Handler - MUST come after all routes
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found !!"));
});

// ✅ Error Handler
app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  console.error('Error:', err);
  res.status(status).render("error.ejs", { message });
});

// Listen on server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;