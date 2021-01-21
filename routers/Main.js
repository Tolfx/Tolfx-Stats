const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

router.get("/", (req, res) => {
  res.render("home");
});

router.get("/setup", (req, res) => {
  User.findOne({ username: "admin" }).then(u => {
    if(u) {
      return res.redirect("back");
    } else {
      res.render("setup");
    }
  });
});

router.post("/setup", (req, res) => {
  User.findOne({ username: "admin" }).then(u => {
    if(u) {
      return res.redirect("back");
    } else {
      //Todo
    }
  });
});

//Login route
router.get('/login', (req, res) => {
  res.render('login');
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/lobby',
    failureRedirect: '/login',
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'Logged out');
  res.redirect('/login');
});

module.exports = router;