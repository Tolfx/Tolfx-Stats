let { TableData, Tables } = require("../models/Tables");
let Notis = require("../models/Notis");

module.exports = {
    ensureIsLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }

        req.flash("error_msg", "Please login to view this.");
        res.redirect("/login");
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
    },

    setGeneral: async (req, res, next) => {
        let data = {};

        if(req.isAuthenticated()) {
            data.isAuth = true;
        } else {
            data.isAuth = false;
        }

        data.tables = await Tables.find() ? await Tables.find() : [];

        data.notis = await Notis.find() ? await Notis.find() : [];

        res.general = data;
        next();
    }
}