const { TableData, Tables } = require("../models/Tables");
const Notis = require("../models/Notis");
const { Map } = require("../models/Explorer");
const log = require("../lib/Loggers");
const Settings = require("../models/Settings");
const Roles = require("../models/Roles");

async function setGeneral (req, res, next) {
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

    data.settings = await Settings.find() ? await Settings.find() : [];

    res.general = data;
    next();
}

module.exports = setGeneral;