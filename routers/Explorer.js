const express = require('express');
const router = express.Router();
const User = require('../models/User');
const log = require("../lib/Loggers");
const { File, Map } = require("../models/Explorer");
const { GFS_find, GFS_DisplayImage, GFS_Remove, GFS_findOne } = require("../lib/FilesHandler")
const upload = require("../lib/Storage");
const { checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin } = require("../configs/Authenticate");
const Roles = require("../models/Roles");
const cleanQuery = require('mongo-sanitize');

/**
 * 
 * @param {*} tableData 
 * @param {*} req 
 * @description Check if the user has write permission on this map.
 */
function checkWritePerm(map, req)
{
    let userRole = req.user.role;
    if(map.writeRoles.includes(userRole))
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
 * @description Check if the user has read permission on this map.
 */
function checkReadPerm(map, req)
{
    let userRole = req.user.role;
    if(map.readRoles.includes(userRole))
    {
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * @GET /explorer
 * @description Default route for /explorer.
 */
router.get("/", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Map.find().then(map => {
        return res.render("explorer/main-explorer", {
            general: res.general,
            maps: map
        });
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
});

/**
 * @GET /explorer/map/:map_id
 * @description Views a specific map by id.
 */
router.get("/map/:map_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let mapId = cleanQuery(req.params.map_id)
    Map.findOne({ _id: mapId }).then(map => {
        if(map) {
            if(checkReadPerm(map, req))
            {
                File.find({ whichFolderId: map._id }).then(f => {
                    return res.render("explorer/map-explorer", {
                        general: res.general,
                        map,
                        files: f
                    });
                }).catch(e => {
                    log.error(e);
                    req.flash("error_msg", "Something went wrong.. try again later.")
                    return res.redirect("back");
                })
            }
            else
            {
                req.flash("error_msg", "You don't have permission to view this map.");
                return res.redirect("back");
            }
        } else {
            req.flash("error_msg", "Unable to find map");
            return res.redirect("back");            
        }
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
});

/**
 * @GET /explorer/file/:file
 * @description Shows specific file by name, through a pipe.
 */
router.get("/file/:file", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let fileId = cleanQuery(req.params.file);
    File.findOne({ name: fileId }).then(async f => {
        if(f)
        {
            let map = await Map.findOne({ _id: f.whichFolderId }).catch(e => log.error(e));
            if(checkReadPerm(map, req))
            {
                GFS_DisplayImage(fileId).then(a => {
                    return a.pipe(res);
                });
            }
            else
            {
                req.flash("error_msg", "You don't have permission to view this file.");
                return res.redirect("back");
            }
        }
        else
        {
            req.flash("error_msg", "Unable to find file");
            return res.redirect("back");
        }
    })//catch me here
});

/**
 * @GET /explorer/view/:file
 * @description To view a file details etc.
 */
router.get("/view/:file", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let fileId = cleanQuery(req.params.file)
    File.findOne({ name: fileId }).then(async f => {
        if(f)
        {
            let map = await Map.findOne({ _id: f.whichFolderId }).catch(e => log.error(e));
            if(checkReadPerm(map, req))
            {
                return res.render('explorer/view-explorer', 
                {
                    file: f,
                    general: res.general
                });
            }
            else
            {
                req.flash("error_msg", "You don't have permission to view this file.");
                return res.redirect("back");
            }
        }
        else
        {
            req.flash("error_msg", "Unable to find file");
            return res.redirect("back");
        }
    })

});

/**
 * @POST /explorer/file/:file_id/remove
 * @description Removes a specific file by id. (only admin)
 */
router.post("/file/:file_id/remove", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let fileId = cleanQuery(req.params.file_id)
    File.findOne({ _id: fileId }).then(f => {
        if(f) {
            GFS_Remove(f.fileInfo.id).then(async bf => {
                if(bf) {
                    await File.deleteOne({ _id: fileId })
                    req.flash("success_msg", "Succesfully removed file");
                    return res.redirect("back");
                } else {
                    req.flash("error_msg", "Something went wrong.. please try again later.");
                    return res.redirect("back");
                }
            });
        } else {
            req.flash("error_msg", "Unable to find this file");
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. please try again later.");
        return res.redirect("back");
    });
});

/**
 * @POST /explorer/map/:map_id/remove
 * @description Removes a specific map and all is content. (only admin)
 */
router.post("/map/:map_id/remove", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let mapId = cleanQuery(req.params.map_id)
    Map.findOne({ _id: mapId }).then(map => {
        if(map) {
            File.find({ whichFolderId: map._id }).then(async files => {
                if(files) {
                    if(files.length > 0) {
                        for (let i = 0; i < files.length; i++) {
                            log.verbos(`Removed file: ${files[i].fileInfo.originalname}`);
                            await GFS_Remove(files[i].fileInfo.id).catch(e => log.error(e));
                            
                            if(i+1==files.length) {
                                //Remove map and files.
                                await File.deleteMany({ whichFolderId: map._id });
                                await Map.deleteOne({ _id: mapId });
                                req.flash("success_msg", "Succesfully removed map and all files inside of it.");
                                return res.redirect("back");
                            }
                        }
                    } else {
                        //Remove one file and delete.. if possible?
                        await Map.deleteOne({ _id: mapId });
                        req.flash("success_msg", "Succesfully removed map");
                        return res.redirect("back");
                    }
                } else {
                    //remove map only
                    await Map.deleteOne({ _id: mapId });
                    req.flash("success_msg", "Succesfully removed map");
                    return res.redirect("back");
                }
            }).catch(e => {
                log.error(e);
                req.flash("error_msg", "Something went wrong.. try again later.")
                return res.redirect("back");
            })
        } else {
            req.flash("error_msg", "Unable to find map");
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
});

/**
 * @POST /explorer/map/:map_id/edit/permission
 * @description Edits a map specific permission. (only admin)
 */
router.post("/map/:map_id/edit/permission", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let mapId = cleanQuery(req.params.map_id)
    Map.findOne({ _id: mapId }).then(async map => {
        if(map) {
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
                    map.readRoles = finishedReadRoles;
                    map.writeRoles = finishedWriteRoles;

                    map.save().then(nm => {
                        log.verbos(`Changed permissions for ${map.name}`);
                        req.flash("success_msg", "Succesfuly changed permissions");
                        return res.redirect("back");
                    })
                }
            }
        } else {
            req.flash("error_msg", "Unable to find map");
            return res.redirect("back");            
        }
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
})

/**
 * @POST /explorer/map/:map_id/edit
 * @description Edits a map.. not finished.. (only admin)
 * 
 */
router.post("/map/:map_id/edit", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, (req, res) => {
    let mapId = cleanQuery(req.params.map_id)
    Map.findOne({ _id: mapId }).then(map => {
        if(map) {
            
        } else {
            req.flash("error_msg", "Unable to find map");
            return res.redirect("back");
        }
    }).catch(e => {
        log.error(e);
        req.flash("error_msg", "Something went wrong.. try again later.")
        return res.redirect("back");
    });
});

/**
 * @POST /explorer/upload
 * @description Uploads a file to a specific mapid.
 */
router.post("/upload", checkSetup, ensureIsLoggedIn, setGeneral, upload.single("file"), (req, res, next) => {
    function removeFile(fileId) { GFS_Remove(fileId).then(() => true).catch(e => { log.error(e); return false; }) };
    if(req.file) {
        let mapId = cleanQuery(req.body.mapId)
        if(mapId) {
            Map.findOne({ _id: mapId }).then(m => {
                if(m) {
                    if(checkWritePerm(m, req))
                    {
                        new File({
                            whichFolderId: m._id,
                            name: req.file.filename,
                            fileInfo: req.file,
                            hasPassword: false
                        }).save().then(f => {
                            req.flash("success_msg", "File created");
                            return res.redirect("back");
                        })
                    }
                    else
                    {
                        removeFile(req.file.id);
                        req.flash("error_msg", "You don't have permission to upload files.");
                        return res.redirect("back");
                    }

                } else {
                    removeFile(req.file.id)
                    req.flash("error_msg", "Failed to find map");
                    return res.redirect("back");
                }
            });
        } else {
            removeFile(req.file.id)
            req.flash("error_msg", "Unable to obtain mapId from body");
            return res.redirect("back");
        }
    } else {
        removeFile(req.file.id)
        req.flash("error_msg", "Something went wrong.. try again later.");
        return res.redirect("back");
    }
});

/**
 * @POST /explorer/create/map
 * @description Creates a new map. (only admin)
 */
router.post("/create/map", checkSetup, ensureIsLoggedIn, setGeneral, ensureIsAdmin, ensureIsAdmin, (req, res) => {
    let mapName = cleanQuery(req.body.name);
    if(mapName)
    {
        Map.findOne({ name: mapName }).then(map => {
            if(!map) {
                //Add submaps later, for now do it later.
                new Map({
                    name: mapName
                }).save().then(m => {
                    req.flash("success_msg", `Added new map ${mapName}`);
                    return res.redirect("back");
                })
            } else {
                req.flash("error_msg", `A map called ${mapName} already exists`);
                //Go to change map name later..
                return res.redirect("back");
            }
        }).catch(e => {
            log.error(e);
            req.flash("error_msg", "Something went wrong.. try again later.")
            return res.redirect("back");
        });
    }
    else {
        req.flash("error_msg", "Unable to find map name");
        return res.redirect("back");
    }
});

module.exports = router;