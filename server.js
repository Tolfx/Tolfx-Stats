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
const { setGeneral } = require("./configs/Authenticate")
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const cookieParser = require('cookie-parser')
const { Version } = require("./Config");

const is_prod = process.env.ISPROD === "true" ? true : false;
const app = express();

require("./configs/Passport")(passport);

mongoose.connect(process.env.MONGODB_NAV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
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

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            path: "/",
            maxAge: 24*60*60*1000,
            domain: is_prod ? process.env.DOMAIN : '',
            sameSite: is_prod,
        }
    })
);

// Passport middleware
app.use(cookieParser())
app.use(passport.initialize());
app.use(passport.session());

//CSRF
app.use(csrf({ cookie: true }));

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    //Version
    res.locals.version = Version;

    next();
});

// Make the token available to all views
app.use(function (req, res, next){
    res.locals._csrf = req.csrfToken();
    next();
});

//Limiter, to reduce spam if it would happen.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
});

app.use(limiter);

//Routers goes here
app.use("/table", require("./routers/Table"));
app.use("/notis", require("./routers/Notis"));
app.use("/explorer", require("./routers/Explorer"));
app.use("/admin", require("./routers/Admin"));

//This route has to be on the lowest, otherwise epic fail.
app.use("/", require("./routers/Main"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, log.verbos(`Server started on port ${PORT}`));

app.get('*', setGeneral, (req, res) => {
    res.status(404).render('partials/notFound', {
        general: res.general
    });
});

//If in a github action.. exit after 1 min.
if(process.env.GITHUB_ACTION)
{
    setTimeout(() => {
        process.exit(0); // <-- Exit with code 0
    }, 60000) // <--- 1 min
}

//Load events here.
require("./events/NodeEvents")();