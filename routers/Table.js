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

                return res.render("table/view-table", {
                    general: res.general,
                    table: t ? t : A_FakeData,
                    _table: table
                });
            }).catch(e => {
                log.error(e);
                return res.redirect("back");
            });
        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

router.get("/edit/table/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = req.params.table_id;
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            return res.render("table/edit-table", {
                general: res.general,
                table: table
            });
        } else {
            return res.redirect("back");
        }
    });
});

router.post("/edit/table/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = req.params.table_id;
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            let OLD_TableName = table.tableName;
            let NEW_TableName = req.body.tableName;

            if(OLD_TableName != NEW_TableName) {
                table.tableName = NEW_TableName;
            }

            let OLD_Rows = table.rows[0];
            let NEW_Rows = req.body.row;

            if(OLD_Rows != NEW_Rows) {
                table.rows = [NEW_Rows];
                TablesData.find({ tableConnectId: table._id }).then(t => {
                    if(t) {
                        for (let x = 0; x < t.length; x++) {
                            for (let i = 0; i < t[x].tableData.length; i++) {
                                t[x].tableData[i].row = NEW_Rows[i]
    
                                if(i+1 == t[x].tableData.length) {
                                    log.debug("Saving..");
                                    t[x].save().catch(e => log.error(e));
                                }
                            }
                        }
                    }
                });
            }

            table.save().then(newT => {
                req.flash("succes_msg", "Succesfully changed table");
                return res.redirect("back");
            }).catch(e => {
                log.error(e);
                return res.redirect("back");
            })
        } else {
            return res.redirect("back");
        }
    });
});

router.get("/edit/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let rowDataId = req.params.row_id;
    TablesData.findOne({ _id: rowDataId }).then(row => {
        if(row) {
            return res.render("table/edit-row", {
                general: res.general,
                row: row
            });
        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

router.post("/edit/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let rowDataId = req.params.row_id;
    TablesData.findOne({ _id: rowDataId }).then(row => {
        if(row) {
            let OLD_ROW = row.tableData.map(e => e.value);
            let NEW_ROW = req.body.row;

            if(OLD_ROW != NEW_ROW) {
                for (let i = 0; i < OLD_ROW.length; i++) {
                    row.tableData[i].value = NEW_ROW[i];
                    if(i+1 == OLD_ROW.length) {
                        row.save().then(r => {
                            log.debug(r)
                            req.flash("succes_msg", "Succesfully changed row")
                            return res.redirect("back");
                        }).catch(e => {
                            log.error(e);
                            req.flash("error_msg", "Something went wrong.. try again.");
                            return res.redirect("back");
                        });
                    }
                }
            }
        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

router.post("/remove/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {

});

router.post("/remove/table/data/:table_data_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    
});

module.exports = router;