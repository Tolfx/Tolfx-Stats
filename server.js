require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const log = require("./lib/Loggers");
const { SetGeneral } = require("./middlewares/Main");
const { ensureIsLoggedIn } = require("./configs/Authenticate");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const cookieParser = require('cookie-parser');
const { Version, getNewVersion, Port } = require("./Config");

const is_prod = process.env.ISPROD === "true" ? true : false;
const app = express();
require('express-ws')(app);

require("./configs/Passport")(passport);

mongoose.connect(process.env.MONGODB_NAV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
});

const db = mongoose.connection;

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.use(express.static('public'));

//Override
app.use(methodOverride('_method'));

// Express body parser
app.use(express.urlencoded({ extended: true }));

let sessionMiddleWare = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        path: "/",
        maxAge: 24*60*60*1000,
        domain: is_prod ? process.env.DOMAIN : '',
        //secure: is_prod,
        sameSite: is_prod ? 'strict' : false,
    }
})

// Session
app.use(
    sessionMiddleWare
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
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');

    //Version
    res.locals.version = Version;

    res.locals.newVersion = '';

    res.locals.PORT = Port;

    res.locals.isProd = is_prod;

    res.locals.Domain = process.env.DOMAIN;

    getNewVersion().then(e => {
        if(e)
        {
            if(Version != e.version)
            {
                res.locals.newVersion = e.version;
            }
        }

        next();
    }).catch(e => {
        next()
    })
});

// Make the token available to all views
app.use((req, res, next) => {
    res.locals._csrf = req.csrfToken();
    next();
});

//Limiter, to reduce spam if it would happen.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
});

app.use(limiter);

// Firewall
app.use(SetGeneral, require("./middlewares/Security/Firewall").FireWall);

// Autoban
app.use(SetGeneral, require("./middlewares/Security/AutoBan"));

// Routers goes here
app.use("/table", require("./routers/Table"));
app.use("/notis", require("./routers/Notis"));
app.use("/explorer", require("./routers/Explorer"));
app.use("/admin", require("./routers/Admin"));

// This route has to be on the lowest, otherwise epic fail.
app.use("/", require("./routers/Main"));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, log.verbos(`Server started on port ${PORT}`));

app.get('*', SetGeneral, ensureIsLoggedIn, (req, res) => {
    res.status(404).render('partials/notFound', {
        general: res.general
    });
});

// Check if any new updates
getNewVersion().then(e => {
    if(e)
    {
        if(Version != e.version)
        {
            log.warning(`There is a new version (${e.version}) avaiable to download`);
        }
    }
});

// If in a github action.. exit after 1 min.
if(process.env.GITHUB_ACTION)
{
    setTimeout(() => {
        process.exit(0); // <-- Exit with code 0
    }, 60000) // <--- 1 min
}

// Socket
require("socket.io")(server)
    .use((socket, next) => {
        sessionMiddleWare(socket.request, {}, next);
    })
    .on("connection", (socket) => {
        // socket.request
        // Sockets goes here?
        require("./sockets/System")(socket)
    });

// Load events here.
require("./events/NodeEvents")();
require("./events/MongooseEvents")(db);