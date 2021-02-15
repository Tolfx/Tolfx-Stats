const express = require('express');
const router = express.Router();
const User = require('../models/User');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const Roles = require("../models/Roles");
const { checkSetup, ensureIsLoggedIn, setGeneral, checkPermission, ensureIsAdmin } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
  res.render("admin/main-admin", {
    general: res.general
  });
});


router.post("/add-role", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let { name } = req.body;
    if(name)
    {
        Roles.findOne({ name }).then(ro => {
            if(!ro)
            {
                new Roles({
                    name
                }).save().then(nr => {
                    req.flash("success_msg", "Succesfuly made role");
                    return res.redirect("back");
                })
            }
            else
            {
                req.flash("error_msg", "A role named " + name + " already exits");
                return res.redirect("back");
            }
        })
    }
    else
    {
        req.flash("error_msg", "Unable to locate the name for the role");
        return res.redirect("back");
    }
});

module.exports = router;