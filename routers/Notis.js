const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const Notis = require("../models/Notis");
const { Tables, TablesData } = require("../models/Tables");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.find().then(n => {
        res.render("notis/main-notis", {
            general: res.general,
            notis: n
        });
    });
});

router.get("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    res.render("notis/create-notis", {
        general: res.general
    });
});

router.post("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.findOne({ name: req.body.name }).then(n => {
        if(!n) {
            let { name, information, color } = req.body;
            new Notis({
                name,
                information,
                color,
                author: req.user.username
            }).save().then(no => {
                req.flash("success_msg", "Notis made")
                res.redirect("back");
            }).catch(e => {
                log.error(e);
                res.redirect("back");
            })
        } else {
            res.redirect("back");
        }
    })
});

router.post("/save/:notis/pos/:x/:y", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.findOne({ _id: req.params.notis }).then(n => {
        if(n) {
            let { x, y } = req.params;
            n.posX = x;
            n.posY = y
            n.save();
            return res.status(200);
        } else {
            return res.json({ msg: "Fail lol" })
        }
    })
});

module.exports = router;