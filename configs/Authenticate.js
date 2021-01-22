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

    setGeneral: (req, res, next) => {
        let data = {};

        if(req.isAuthenticated()) {
            data.isAuth = true;
        } else {
            data.isAuth = false;
        }

        res.general = data;
        next();
    }
}