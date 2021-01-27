const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const { File, Map } = require("../models/Explorer");
const { GFS_find } = require("../lib/FilesHandler")
const upload = require("../lib/Storage");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Map.find().then(map => {
        res.render("explorer/main-explorer", {
            general: res.general,
            maps: map
        });
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
});

//checkSetup, ensureIsLoggedIn, setGeneral,
router.post("/upload", upload.single("file"), (req, res, next) => {
    
    res.redirect("back");
});

module.exports = router;