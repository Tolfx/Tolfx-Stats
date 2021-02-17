const express = require('express');
const router = express.Router();
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const { checkSetup, ensureIsLoggedIn, setGeneral, checkPermission, ensureIsAdmin } = require("../configs/Authenticate");
const marked = require('marked');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);
const Roles = require("../models/Roles");
const cleanQuery = require('mongo-sanitize');

/**
 * 
 * @param {*} tableData 
 * @param {*} req 
 * @description Check if the user has write permission on this table.
 */
function checkWritePerm(tableData, req)
{
    let userRole = req.user.role;
    if(tableData.writeRoles.includes(userRole))
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * 
 * @param {*} tableData 
 * @param {*} req 
 * @description Check if the user has read permission on this table.
 */
function checkReadPerm(tableData, req)
{
    let userRole = req.user.role;
    if(tableData.readRoles.includes(userRole))
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * @GET /table
 * @description Goes to main /table route.
 */
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

/**
 * @GET /table/create
 * @description Goes to /create route to create a new table.
 */
router.get("/create", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    res.render("table/create-table", {
        general: res.general
    });
});

/**
 * @POST /table/create
 * @description Creates a new table for the following request { tableName, row[] }
 */
router.post("/create", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    /*
        Object: {
            tableName: String,
            rows: Array<String>
        }
    */
    let { tableName, row } = req.body;
    if(tableName && row)
    {
        tableName = cleanQuery(tableName)
        Tables.findOne({ tableName: tableName }).then(table => {
            if(!table) {
                if(!tableName || !row) {
                    req.flash("error_msg", "Please add a table name and row");
                    res.redirect("back");
                }
    
                new Tables({
                    tableName,
                    rows: row
                }).save().then(t => {
                    log.verbos("Created a new table with tableName: " + tableName);
                    req.flash("success_msg", "Table created!");
                    res.redirect(`/table/view/${t._id}`);
                }).catch(e => {
                    log.error(e);
                    req.flash("error_msg", "An error appeared.. please try again.");
                    res.redirect("back");
                });
            } else {
    
                //Change later to edit when added /Done
                req.flash("error_msg", "Table already exists.");
                res.redirect(`/table/edit/table/${table._id}`);
            }
        }).catch(e => {
            log.error(e);
            res.redirect("back");
        });
    }
    else {
        req.flash("error_msg", "Please define table and row");
        res.redirect("back");
    }
});

/**
 * @GET /table/add/:table_id
 * @description Goes to the specific table which can later do a post request to create new data.
 */
router.get("/add/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let Id = cleanQuery(req.params.table_id);
    Tables.findOne({ _id: Id }).then(table => {
        if(table) {
            if(checkWritePerm(table, req))
            {
                res.render("table/add-table", {
                    table,
                    general: res.general
                });
            }
            else
            {
                req.flash("error_msg", "You don't have permission to add to this table");
                return res.redirect("back");
            }

        } else {
            res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

/**
 * @POST /table/add/:table_id
 * @description Adds new data to the specific table, which gets added to the tabledata db.
 */
router.post("/add/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let Id = cleanQuery(req.params.table_id);
    Tables.findOne({ _id: Id }).then(table => {
        if(table) {
            if(checkWritePerm(table, req))
            {
                /*
                * When the user sends a post request here, we can't be sure to know,
                * what specific row name will be sent.
                * Therefor this method is being used.
                */

                //Get the body from the request.
                let reqBody = req.body;

                //We want to take the keys (aka the row name)
                let reqBodyArray = Object.keys(reqBody);

                //Here we take the value from it, which will be an array according to reqBodyArray.
                let reqBodyValues = Object.values(reqBody);

                //Using this to store the final data.
                let final = [];
                for(let i = 0; i < table.rows.length; i++) {
                    log.debug("Looking for items..");

                    //Looking if reqBody has the same property from the table (db)
                    if(reqBody.hasOwnProperty(table.rows[i])) {
                        log.debug("Found match on " + table.rows[i]);

                        //If we succed to find one, we want to know where in the index is at.
                        let indexOfBody = reqBodyArray.indexOf(table.rows[i]);

                        //If it really existed.. to double check.
                        if(indexOfBody > -1) {

                            //We push it to final[] with different values.
                            final.push({
                                        //So we take the reqBodyValues and take the index that we got.
                                value: reqBodyValues[indexOfBody],
                                valueS: dompurify.sanitize(marked(reqBodyValues[indexOfBody])),
                                row: table.rows[i]
                            });
                        }
                    }

                    if(i+1 == table.rows.length) {
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
            }
            else
            {
                req.flash("error_msg", "You don't have permission to add to this table");
                return res.redirect("back");
            }
        } else {
            res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        res.redirect("back");
    });
});

/**
 * @GET /table/:table_id
 * @description Views the specific table, with it specific data.
 */
router.get("/view/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = cleanQuery(req.params.table_id);
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            if(checkReadPerm(table, req))
            {
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
            }
            else
            {
                req.flash("error_msg", "You don't have permission to view this table");
                return res.redirect("back");
            }
        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

/**
 * @GET /table/edit/table/:table_id
 * @description To edit a tables row or name.
 */
router.get("/edit/table/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = cleanQuery(req.params.table_id);
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            if(checkWritePerm(table, req))
            {
                return res.render("table/edit-table", {
                    general: res.general,
                    table: table
                });
            }
            else
            {
                req.flash("error_msg", "You don't have any write permission.");
                return res.redirect("back");
            }
        } else {
            return res.redirect("back");
        }
    });
});

/**
 * @POST /table/edit/:table_id
 * @description Edits the tables name or rows.
 */
router.post("/edit/table/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let tableId = cleanQuery(req.params.table_id);
    Tables.findOne({ _id: tableId }).then(table => {
        if(table) {
            if(checkWritePerm(table, req))
            {
                let OLD_TableName = table.tableName;
                let NEW_TableName = req.body.tableName;

                if(OLD_TableName != NEW_TableName) {
                    table.tableName = NEW_TableName;
                }

                let OLD_Rows = table.rows;
                let NEW_Rows = req.body.row;

                if(OLD_Rows != NEW_Rows) {
                    table.rows = NEW_Rows;
                    TablesData.find({ tableConnectId: table._id }).then(t => {
                        if(t) {
                            for (let x = 0; x < t.length; x++) {
                                for (let i = 0; i < t[x].tableData.length; i++) {
                                    t[x].tableData[i].row = NEW_Rows[i]
        
                                    if(i+1 == t[x].tableData.length) {
                                        log.debug("Saving..");
                                        
                                        //This .markModified is needed or it gets cucked hard.
                                        t[x].markModified('tableData');
                                        t[x].save().catch(e => log.error(e));
                                    }
                                }
                            }
                        }
                    });
                }

                table.save().then(newT => {
                    req.flash("success_msg", "Succesfully changed table");
                    return res.redirect("back");
                }).catch(e => {
                    log.error(e);
                    return res.redirect("back");
                });
            }
            else
            {
                req.flash("error_msg", "You don't have any write permission.");
                return res.redirect("back");
            }
        } else {
            return res.redirect("back");
        }
    });
});

/**
 * @GET /table/edit/:row_id
 * @description To edit specific rows. 
 */
router.get("/edit/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let rowDataId = cleanQuery(req.params.row_id);
    TablesData.findOne({ _id: rowDataId }).then(async row => {
        if(row) {
            Tables.findOne({ _id: row.tableConnectId }).then(t => {
                if(checkWritePerm(t, req))
                {
                    return res.render("table/edit-row", {
                        general: res.general,
                        row: row,
                        table: t
                    });
                }
                else
                {
                    req.flash("error_msg", "You don't have any write permission.");
                    return res.redirect("back");
                }

            })

        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

/**
 * @POST /table/edit/row/:row_id
 * @description Edits the specific rows in table.
 */
router.post("/edit/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let rowDataId = cleanQuery(req.params.row_id);
    TablesData.findOne({ _id: rowDataId }).then(row => {
        if(row) 
        {
            Tables.findOne({ _id: row.tableConnectId }).then(t => {
                if(checkWritePerm(t, req))
                {
                    let OLD_ROW = row.tableData.map(e => e.value);
                    let NEW_ROW = req.body.row;
                    if(!NEW_ROW.length >= 100)
                    {
                        if(OLD_ROW != NEW_ROW) {
                            //If new rows..
                            if(NEW_ROW.length > OLD_ROW.length) {
                                log.debug("New row added")
                                row.tableData.push({value: null, row: null, valueS: null});
                            }
        
                            for (let i = 0; i < NEW_ROW.length; i++) {
                                row.tableData[i].value = NEW_ROW[i];
                                row.tableData[i].valueS = dompurify.sanitize(marked(NEW_ROW[i]));
                                if(i+1 == OLD_ROW.length) {
                                    row.markModified('tableData');
                                    row.save().then(r => {
                                        req.flash("success_msg", "Succesfully changed row")
                                        return res.redirect("back");
                                    }).catch(e => {
                                        log.error(e);
                                        req.flash("error_msg", "Something went wrong.. try again.");
                                        return res.redirect("back");
                                    });
                                }
                            }
                        }
                    }
                }
                else
                {
                    req.flash("error_msg", "You don't have any write permission.");
                    return res.redirect("back");
                }
            })
        } else {
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        return res.redirect("back");
    });
});

/**
 * @GET /table/remove/row/:row_id
 * @description To remove a specific row, that is not needed.. this will be effected in tablesdata.
 */
router.get("/remove/row/:row_id", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    TablesData.deleteOne({ _id: cleanQuery(req.params.row_id) }).then(r => {
        req.flash("success_msg", "Removed the row");
        return res.redirect("back");
    });
});

/**
 * @GET /table/edit/permission/:table_id
 * @description Edit permission on specific table.
 */
router.post("/edit/permission/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let tableId = cleanQuery(req.params.table_id);
    if(tableId)
    {
        Tables.findOne({ _id: tableId }).then(async t => {
            if(t)
            {
                //Gather the roles.
                let roles = await Roles.find().catch(e => log.error(e));
                let reqBody = req.body;
                let finishedWriteRoles = [];
                let finishedReadRoles = [];
                for (let i = 0; i < roles.length; i++) {
                    if(reqBody[roles[i].name+'Write'])
                    {
                        finishedWriteRoles.push(roles[i].name)
                    }
                    if(reqBody[roles[i].name+'Read'])
                    {
                        finishedReadRoles.push(roles[i].name)
                    }

                    if(i+1 == roles.length)
                    {
                        t.readRoles = finishedReadRoles;
                        t.writeRoles = finishedWriteRoles;

                        t.save().then(nt => {
                            log.verbos(`Changed permissions for ${t.tableName}`);
                            req.flash("success_msg", "Succesfuly changed permissions");
                            return res.redirect("back");
                        })
                    }
                }
            }
            else
            {
                req.flash("error_msg", "This table doesn't exit");
                return res.redirect("back");
            }
        }).catch(e => {
            log.error(e);
            return res.redirect("back");
        })
    }
    else
    {
        req.flash("error_msg", "Something went wrong, try again.");
        return res.redirect("back");
    }
});

/**
 * @GET /table/remove/table/:table_id
 * @description To removes a specific table, and all of is data.
 */
router.get("/remove/table/:table_id", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    Tables.deleteOne({ _id: cleanQuery(req.params.table_id) }).then(t => {
        TablesData.deleteMany({ tableConnectId: req.params.table_id }).then(r => {
            req.flash("success_msg", "Removed table and all data..");
            return res.redirect("/table");
        });
    });
});

module.exports = router;