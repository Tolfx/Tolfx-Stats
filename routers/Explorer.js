const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const { File, Map } = require("../models/Explorer");
const { GFS_find, GFS_DisplayImage, GFS_Remove } = require("../lib/FilesHandler")
const upload = require("../lib/Storage");
const { checkSetup, ensureIsLoggedIn, setGeneral } = require("../configs/Authenticate");

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

router.get("/map/:map_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Map.findOne({ _id: req.params.map_id }).then(map => {
        if(map) {
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

router.get("/file/:file", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    GFS_DisplayImage(req.params.file).then(a => {
        return a.pipe(res);
    });
});

router.get("/file1/:file", (req, res) => {
    GFS_DisplayImage(req.params.file).then(a => {
        return a.pipe(res);
    });
});

router.post("/file/:file_id/remove", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    File.findOne({ _id: req.params.file_id }).then(f => {
        if(f) {
            GFS_Remove(f.fileInfo.id).then(async bf => {
                if(bf) {
                    await File.deleteOne({ _id: req.params.file_id })
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

router.post("/edit/map/:map_id", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    Map.findOne({ _id: req.params.map_id }).then(map => {
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

//checkSetup, ensureIsLoggedIn, setGeneral,
router.post("/upload", upload.single("file"), (req, res, next) => {
    if(req.file) {
        if(req.body.mapId) {
            Map.findOne({ _id: req.body.mapId }).then(m => {
                if(m) {
                    new File({
                        whichFolderId: m._id,
                        name: req.file.filename,
                        fileInfo: req.file,
                        hasPassword: false
                    }).save().then(f => {
                        req.flash("success_msg", "File created");
                        return res.redirect("back");
                    })
                } else {
                    req.flash("error_msg", "Failed to find map");
                    return res.redirect("back");
                }
            });
        } else {
            req.flash("error_msg", "Unable to obtain mapId from body");
            return res.redirect("back");
        }
    } else {
        req.flash("error_msg", "Something went wrong.. try again later.");
        return res.redirect("back");
    }
});

router.post("/create/map", checkSetup, ensureIsLoggedIn, setGeneral, (req, res) => {
    let mapName = req.body.name;
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
});

module.exports = router;