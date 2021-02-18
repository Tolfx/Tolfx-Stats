const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const { ensureIsLoggedIn } = require("../configs/Authenticate");
const { CheckSetup, SetGeneral } = require("../middlewares/Main");

router.get("/", CheckSetup, ensureIsLoggedIn, SetGeneral, (req, res) => {
  res.render("home", {
    general: res.general
  });
});

module.exports = router;