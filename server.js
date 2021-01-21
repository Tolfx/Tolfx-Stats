if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const mongoose = require('mongoose');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const log = require("./lib/Loggers");

const app = express();

mongoose.connect(process.env.MONGODB_NAV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (error) => log.error(error));

db.once('open', () => {
    log.verbos("Connected to database");
});

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static('public'));

//Override
app.use(methodOverride('_method'));

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

//Routers goes here


//This route has to be on the lowest, otherwise epic fail.
app.use("/", require("./routers/Main"));

const PORT = 5000;

app.listen(PORT, log.verbos(`Server started on port ${PORT}`));

app.get('*', (req, res) => {
res.status(404).render('notFound');
});