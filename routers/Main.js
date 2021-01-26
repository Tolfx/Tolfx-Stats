const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
  res.render("home", {
    general: res.general
  });
});

router.get("/setup", setGeneral, (req, res) => {
  User.findOne({ username: "admin" }).then(u => {
    if(u) {
      return res.redirect("back");
    } else {
      res.render("partials/setup", {
        general: res.general
      });
    }
  });
});

router.post("/setup", (req, res) => {
  User.findOne({ username: "admin" }).then(u => {
    if(u) {
      return res.redirect("back");
    } else {
      let { password, password2, email } = req.body;

      if(!email) {
        req.flash("error_msg", "No email found");
        return res.redirect("back");
      }

      if(password != password2) {
        req.flash("error_msg", "The password didn't match");
        return res.redirect("back");
      } else {
        try {
          let hashPassword = password
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
              if(err)
                log.error(err)

                new User({
                  username: "admin",
                  password: hash,
                  email: email,
                  role: "admin"
                }).save().then(a => {
                  log.debug("Admin user created for setup");
                  req.flash("success_msg", "Admin user has been created!")
                  res.redirect("/login");
                })
              })
            })
            
        } catch(err) {
          log.error(err)
        }
      }
    }
  });
});

//Login route
router.get('/login', checkSetup, setGeneral, (req, res) => {
  res.render('login', {
    general: res.general
  });
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get('/logout', checkSetup, (req, res) => {
  req.logout();
  req.flash('success_msg', 'Logged out');
  res.redirect('/login');
});

module.exports = router;