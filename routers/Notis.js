const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const Notis = require("../models/Notis");
const { Tables, TablesData } = require("../models/Tables");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");
const cleanQuery = require('mongo-sanitize');

/**
 * @GET /notis
 * @description Default route for /notis.
 */
router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Notis.find().then(n => {
        res.render("notis/main-notis", {
            general: res.general,
            notis: n
        });
    });
});

/**
 * @GET /notis/create
 * @description To create a new notis.
 */
router.get("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    res.render("notis/create-notis", {
        general: res.general
    });
});

/**
 * @POST /notis/create
 * @description To create a new notis post.
 */
router.post("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let { name, information, color, width, height } = req.body;
    if(!name || !information || !color) {
        req.flash("error_msg", "Something was missing, try again");
        return res.redirect("back");
    }
    else
    {
        name = cleanQuery(name)
        Notis.findOne({ name: name, author: req.user.username }).then(n => {
            if(!n) {
                new Notis({
                    name,
                    information,
                    color,
                    width,
                    height,
                    author: req.user.username
                }).save().then(no => {
                    log.verbos(`A new notis has been created from user ${req.user.username}.`)
                    req.flash("success_msg", "Notis made")
                    return res.redirect("/notis/edit/"+no._id);
                }).catch(e => {
                    log.error(e);
                    res.redirect("back");
                })
            } else {
                req.flash("error_msg", "Already an existing notis with the same name.");
                res.redirect("/notis/edit/"+n._id);
            }
        })
    }
});

/**
 * @GET /notis/edit/:notis_id
 * @description To edit a already existing notis.
 */
router.get("/edit/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let notisId = cleanQuery(req.params.notis_id)
    Notis.findOne({ _id: notisId }).then(n => {
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

/**
 * @POST /notis/edit/:notis_id
 * @description To edit a already existing notis.
 */
router.post("/edit/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let notisId = cleanQuery(req.params.notis_id)
    Notis.findOne({ _id: notisId }).then(n => {
        if(n) {
            let { color, information, name, active, height, width } = req.body;

            if(!color || !information || !name) {
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

            if(n.height != height) {
                n.height = height;
            }

            if(n.width != width) {
                n.width = width;
            }

            if(n.information != information) {
                n.information = information;
            }

            if(n.name != name) {
                n.name = name;
            }

            n.save().then(() => {
                log.verbos(`${n.name} (${n._id}) was edited by user`)
                req.flash("success_msg", "Succesfully changed notis.");
                return res.redirect("back");
            }).catch(e => {
                log.error(e);
                req.flash("error_msg", "Something went wrong.. try again later.");
                return res.redirect("back");
            })
        } else {
            req.flash("error_msg", "Unable to find this specific notis..");
            return res.redirect("back");
        }
    });
});

/**
 * @GET /notis/remove/:notis_id
 * @description Removes a notis for the specific ID
 */
router.get("/remove/:notis_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let notisId = cleanQuery(req.params.notis_id)
    Notis.deleteOne({ _id: notisId }).then(n => {
        log.warning(`${notisId} was deleted.`)
        req.flash("success_msg", "Succesfully removed notis");
        return res.redirect("/notis");
    })
});

/**
 * @POST /notis/save/:notis/pos/:x/:y
 * @description Saves a notis position.
 */
router.post("/save/:notis/pos/:x/:y", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let notisId = cleanQuery(req.params.notis)
    Notis.findOne({ _id: notisId }).then(n => {
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

/**
 * @POST /notis/:notis/closed/:active
 * @description Closes the notis, or opens it depending on the value (boolean)
 */
router.post("/save/:notis/closed/:active", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let notisId = cleanQuery(req.params.notis)
    Notis.findOne({ _id: notisId }).then(n => {
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