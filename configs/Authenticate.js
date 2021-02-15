const { TableData, Tables } = require("../models/Tables");
const Notis = require("../models/Notis");
const { Map } = require("../models/Explorer");
const log = require("../lib/Loggers");
const Settings = require("../models/Settings");
const Roles = require("../models/Roles");

module.exports = {
    ensureIsLoggedIn: (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (req.isAuthenticated()) {
            log.verbos(`${ip} (${req.user.username}) is viewing ${req.originalUrl}`)
            return next();
        }
        log.verbos(`${ip} attempted to view ${req.originalUrl}`)
        req.flash("error_msg", "Please login to view this.");
        res.redirect("/login");
    },

    ensureIsAdmin: (req, res, next) =>
    {
        if(req.user.role === 'admin')
        {
            next()
        }
        else
        {
            req.flash("error_msg", "Only admins are allowed.");
            return res.redirect("back");
        }
    },

    checkSetup: (req, res, next) => {
        require("../models/User").findOne({ username: "admin" }).then(u => {
            if(!u) {
                req.flash("error_msg", "Please do a setup first!");
                res.redirect("/setup");
            } else {
                next();
            }
        });

        Settings.find().then(s => {
            if(s.length <= 0)
            {
                log.error("No settings.. creating one");
                new Settings().save();
            }
        });

        Roles.findOne({ name: 'admin' }).then(r => {
            if(!r)
            {
                log.error(`Role admin has not been created.. creating one.`);
                new Roles({
                    name: 'admin'
                }).save();
            }
        });

    },

    setGeneral: async (req, res, next) => {
        let data = {};

        if(req.isAuthenticated()) {
            data.isAuth = true;

            if(req.user.role === "admin") {
                data.isAdmin = true;
            } else {
                data.isAdmin = false;
            }

            data.user = req.user;
        } else {
            data.isAuth = false;
        }

        data.tables = await Tables.find() ? await Tables.find() : [];

        data.notis = await Notis.find() ? await Notis.find() : [];

        data.maps = await Map.find() ? await Map.find() : [];

        data.roles = await Roles.find() ? await Roles.find() : [];

        res.general = data;
        next();
    }
}