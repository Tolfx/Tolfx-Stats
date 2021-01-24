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
            if(!name || !information || !color) {
                req.flash("error_msg", "Something was missing, try again");
                return res.redirect("back");
            }

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
            req.flash("error_msg", "Already an existing notis with the same name.");
            res.redirect("/notis/edit/"+n._id);
        }
    })
});

router.get("/edit/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.findOne({ _id: req.params.notis_id }).then(n => {
        if(n) {
            res.render("notis/edit-notis", {
                notis: n,
                general: res.general
            });
        } else {
            req.flash("error_msg", "Unable to find this specific notis..");
            res.redirect("back");
        }
    });
});

router.post("/edit/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.findOne({ _id: req.params.notis_id }).then(n => {
        if(n) {
            let { color, information, name, active } = req.body;

            if(!color || !information || !name || !active) {
                req.flash("error_msg", "Something was missing, please try again");
                return res.redirect("back");
            }
            
            if(typeof active != "undefined") {
                n.active = true;
            } else {
                n.active = false;
            }

            if(n.color != color) {
                n.color = color;
            }

            if(n.information != information) {
                n.information = information;
            }

            if(n.name != name) {
                n.name = name;
            }

            n.save().then(() => {
                req.flash("success_msg", "Succesfully changed notis.");
                res.redirect("back");
            }).catch(e => {
                log.error(e);
                req.flash("error_msg", "Something went wrong.. try again later.");
                res.redirect("back");
            })
        } else {
            req.flash("error_msg", "Unable to find this specific notis..");
            res.redirect("back");
        }
    });
});

router.get("/remove/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.deleteOne({ _id: req.params.notis_id }).then(n => {
        req.flash("success_msg", "Succesfully removed notis");
        res.redirect("back");
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
    });
});

router.post("/save/:notis/closed/:active", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.findOne({ _id: req.params.notis }).then(n => {
        if(n) {
            let { active } = req.params;
            n.closed = active
            n.save();
            return res.status(200);
        } else {
            return res.json({ msg: "Fail lol" })
        }
    });
});

module.exports = router;