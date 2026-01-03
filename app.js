const express = require('express');
const app = express();
const path = require("path");
const ejsMate = require('ejs-mate');
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const MONGO_URL = "mongodb://127.0.0.1:27017/villageStay";
const ExpressError = require('./utils/ExpressError.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const User = require('./models/users.js');

// Import Routes
const authRoutes = require('./routes/auth.js');
const villageRoutes = require('./routes/villages.js');
const postRoutes = require('./routes/posts.js');
const messageRoutes = require('./routes/messages.js');

// Database Connection
main()
  .then(() => { console.log("connection successful") })
  .catch(err => console.log(err));


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

// Session Configuration
const sessionConfig = {
    secret: 'mysecretcode',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};



app.use(session(sessionConfig));
app.use(flash());

// Passport Configuration
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

// Global Middleware
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Landing Page
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/posts');
    }
    res.render("landing.ejs");
});

// Use Routes
app.use('/', authRoutes);
app.use('/villages', villageRoutes);
app.use('/posts', postRoutes);
app.use('/messages', messageRoutes);

// Error Handling
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found !!"));
});

app.use((err, req, res, next) => {
  let { status = 500, message = "Something went wrong" } = err;
  res.status(status).render("error.ejs", { message });
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});