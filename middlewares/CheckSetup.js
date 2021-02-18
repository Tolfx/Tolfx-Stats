const { TableData, Tables } = require("../models/Tables");
const Notis = require("../models/Notis");
const { Map } = require("../models/Explorer");
const log = require("../lib/Loggers");
const Settings = require("../models/Settings");
const Roles = require("../models/Roles");

function checkSetup(req, res, next) {
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
                name: 'admin',
                canCreate: true,
                canRemove: true,
                root: true
            }).save();
        }
    });
}

module.exports = checkSetup;