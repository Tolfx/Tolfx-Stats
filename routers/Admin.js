const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const Roles = require("../models/Roles");
const { checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
  res.render("admin/main-admin", {
    general: res.general
  });
});


router.post("/add-role", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let { name } = req.body;
    if(name)
    {
        Roles.findOne({ name: name }).then(ro => {
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

router.post("/add-user", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let { password, password2, email, username, role } = req.body;

    if(!email) {
        req.flash("error_msg", "No email found");
        return res.redirect("back");
    }

    if(!username)
    {
        req.flash("error_msg", "No username found");
        return res.redirect("back");
    }

    if(!role)
    {
        req.flash("error_msg", "No role found");
        return res.redirect("back");
    }

    User.findOne({ username: username }).then(u => {
        if(u) 
        {
            req.flash("error_msg", "User already exists")
            return res.redirect("back");
        } 
        else 
        {
          if(password != password2) {
            req.flash("error_msg", "The password didn't match");
            return res.redirect("back");
          } else {
            try {
                bcrypt.genSalt(10, (err, salt) => 
                {
                    bcrypt.hash(password, salt, (err, hash) => 
                    {
                        if(err)
                            log.error(err)
            
                        new User({
                            username: username,
                            password: hash,
                            email: email,
                            role: role
                        }).save().then(a => {
                            log.verbos(`A new user has been created with username: ${username}, and role: ${role}`);
                            req.flash("success_msg", "User has been created!")
                            return res.redirect("/login");
                        });
                    });
                });
                
            } catch(err) {
              log.error(err)
              req.flash("error_msg", "An error accured")
              return res.redirect("back");
            };
          };
        };
    });
});

module.exports = router;