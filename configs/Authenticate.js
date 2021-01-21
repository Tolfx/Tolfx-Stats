module.exports = {
    ensureIsLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) {
            return next();
        }

        req.flash("error_msg", "Please login to view this.");
        res.redirect("back");
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
    }
}