const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const Logging = require("../models/Logging");
const Roles = require("../models/Roles");
const { ensureIsLoggedIn, ensureIsAdmin } = require("../configs/Authenticate");
const cleanQuery = require('mongo-sanitize');
const { CheckSetup, SetGeneral, Pagination } = require("../middlewares/Main");

router.get("/", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, async (req, res) => {
    res.render("admin/main-admin", {
        general: res.general,
        allUsers: await User.find()
    });
});

router.get("/logs", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, Pagination(Logging, true), (req, res) => {
    let pages = res.paginatedPage;
    res.render("admin/logs", {
        general: res.general,
        pages: pages
    });
});

router.post("/add-role", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
    let { name } = req.body;
    name = cleanQuery(name);
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

router.post("/add-user", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
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

    username = cleanQuery(username);

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

router.post("/remove-user", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
    let { user } = req.body;
    user = cleanQuery(user);
    if(user)
    {
        User.findOne({ username: user }).then(u => {
            if(u)
            {
                User.deleteOne({ username: user }).then(du => {
                    req.flash("success_msg", "User deleted");
                    return res.redirect("back");
                }).catch(e => {
                    log.error(e)
                    req.flash("error_msg", "Something went wrong.. try again later.");
                    return res.redirect("back");
                })
            }
            else
            {
                req.flash("error_msg", "User doesn't exist");
                return res.redirect("back");
            }
        }).catch(e => {
            log.error(e)
            req.flash("error_msg", "Something went wrong.. try again later.");
            return res.redirect("back");
        })
    }
    else
    {
        req.flash("error_msg", "Please define user in body");
        return res.redirect("back");
    }
});

router.post("/remove-role", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
    let { role } = req.body;
    role = cleanQuery(role);
    if(role)
    {
        Roles.findOne({ name: role }).then(r => {
            if(r)
            {
                User.findOne({ role: role }).then(u => {
                    if(!u)
                    {
                        Roles.deleteOne({ name: role }).then(dr => {
                            req.flash("success_msg", "Role deleted");
                            return res.redirect("back");
                        }).catch(e => {
                            log.error(e)
                            req.flash("error_msg", "Something went wrong.. try again later.");
                            return res.redirect("back");
                        });                        
                    }
                    else
                    {
                        req.flash("error_msg", "Roles has been detected to be registered on user(s), therefor role wont be deleted.");
                        return res.redirect("back");
                    }
                }).catch(e => {
                    log.error(e)
                    req.flash("error_msg", "Something went wrong.. try again later.");
                    return res.redirect("back");                    
                })
            }
            else
            {
                req.flash("error_msg", "Role doesn't exist");
                return res.redirect("back");
            }
        }).catch(e => {
            log.error(e)
            req.flash("error_msg", "Something went wrong.. try again later.");
            return res.redirect("back");
        })
    }
    else
    {
        req.flash("error_msg", "Please define role in body");
        return res.redirect("back");
    }
});

module.exports = router;