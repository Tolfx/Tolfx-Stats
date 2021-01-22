const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");

router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Tables.find().then(t => {
        res.render("table/main-table", {
            tables: t,
            general: res.general
        });
    });
});

router.get("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    res.render("table/create-table", {
        general: res.general
    });
});

router.post("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    res.redirect("back");
})

router.get("/view/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = req.params.table_id;

});

module.exports = router;