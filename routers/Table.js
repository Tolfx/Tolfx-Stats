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
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

router.get("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    res.render("table/create-table", {
        general: res.general
    });
});

router.post("/create", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    /*
        Object: {
            tableName: String,
            rows: Array<String>
        }
    */
    let { tableName, row } = req.body;
    Tables.findOne({ tableName }).then(table => {
        if(!table) {
            let A_Dummy = [];
            if(!tableName || !row) {
                req.flash("error_msg", "Please add a table name and row");
                res.redirect("back");
            }
    
            if(typeof row != "array") {
                A_Dummy.push(row);
            }
            log.debug(row);
            new Tables({
                tableName,
                rows: typeof row === "array" ? row : A_Dummy
            }).save().then(t => {
                log.verbos("Created a new table with tableName: " + tableName);
                req.flash("succes_msg", "Table created!");
                res.redirect(`/table/view/${t._id}`);
            }).catch(e => {
                log.error(e);
                req.flash("error_msg", "An error appeared.. please try again.");
                res.redirect("back");
            });
        } else {

            //Change later to edit when added
            res.redirect(`/table/view/${table._id}`);
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

router.get("/add/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let Id = req.params.table_id;
    Tables.findOne({ _id: Id }).then(table => {
        if(table) {
            res.render("table/add-table", {
                table,
                general: res.general
            });
        } else {
            res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

router.post("/add/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let Id = req.params.table_id;
    Tables.findOne({ _id: Id }).then(table => {
        if(table) {
            let reqBody = req.body;
            let reqBodyArray = Object.keys(reqBody);
            let reqBodyValues = Object.values(reqBody);
            let final = [];
            for(let i = 0; i < table.rows[0].length; i++) {
                if(reqBody.hasOwnProperty(table.rows[0][i])) {
                    log.debug("Found match on " + table.rows[0][i]);
                    let indexOfBody = reqBodyArray.indexOf(table.rows[0][i]);
                    
                    if(indexOfBody > -1) {
                        final.push({
                            value: reqBodyValues[indexOfBody],
                            row: table.rows[0][i]
                        });
                    }
                }

                if(i+1 == table.rows[0].length) {
                    log.debug(final + " <-- Final");
                    new TablesData({
                        tableData: final,
                        tableRow: table.tableName,
                        tableConnectId: table._id
                    }).save().then(newT => {
                        log.debug("Created new table data");
                        res.redirect("/table/view/"+table._id);
                    }).catch(e => {
                        log.error(e);
                        res.redirect("back");
                    })
                }
            }
        } else {
            res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

router.get("/view/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = req.params.table_id;
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            TablesData.find({ tableConnectId: table._id }).then(t => {
                let A_FakeData = [];

                res.render("table/view-table", {
                    general: res.general,
                    table: t ? t : A_FakeData,
                    _table: table
                });
            }).catch(e => {
                log.error(e);
                res.redirect("back");
            });
        } else {
            res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

router.post("/remove/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {

});

router.post("/remove/table/data/:table_data_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    
});

module.exports = router;