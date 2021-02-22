const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const log = require("../lib/Loggers");
const { Tables, TablesData } = require("../models/Tables");
const Settings = require("../models/Settings");
const Logging = require("../models/Logging");
const Roles = require("../models/Roles");
const { ensureIsLoggedIn, ensureIsAdmin } = require("../configs/Authenticate");
const cleanQuery = require('mongo-sanitize');
const { CheckSetup, SetGeneral, Pagination } = require("../middlewares/Main");
const upload = require("../lib/Storage");
const { GFS_DisplayImage } = require("../lib/FilesHandler");
const fs = require("fs");
const Log = require('../models/Logging');

router.get("/", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, async (req, res) => {
    res.render("admin/main-admin", {
        general: res.general,
        allUsers: await User.find()
    });
});

router.get("/logs", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, Pagination(Logging, true), (req, res) => {
    let pages = res.paginatedPage;
    res.render("admin/modals/view/logs", {
        general: res.general,
        pages: pages
    });
});

router.get("/logo", CheckSetup, SetGeneral, (req, res) => {
    Settings.find().then(s => {
        GFS_DisplayImage(s[0].logo).then(i => {
            i.pipe(res);
        }).catch(e => {
            log.warning(`No logo has been set yet, using default..`);
            let dir = process.cwd();
            dir += "/public/TX-Small.png";

            fs.readFile(dir, (err, data) => {
                if(err)
                    return res.status(404);
                fs.createReadStream(dir).pipe(res);
            });
        })
    }).catch(e => {
        log.error(e, log.trace());
        log.warning(`There was an error while getting settings, setting default`);
        let dir = process.cwd();
        dir += "/public/TX-Small.png";

        fs.readFile(dir, (err, data) => {
            if(err)
                return res.status(404);
            fs.createReadStream(dir).pipe(res);
        });
    })
});

router.post("/add-role", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
    let { name, p_remove, p_create, root } = req.body;
    name = cleanQuery(name);
    if(name)
    {
        Roles.findOne({ name: name }).then(ro => {
            if(!ro)
            {
                new Roles({
                    name,
                    canCreate: p_create == 'on' ? true : false,
                    canRemove: p_remove == 'on' ? true : false,
                    root: root == 'on' ? true : false
                }).save().then(nr => {
                    log.info(`A new user has been created with name: ${name}${root == 'on' ? ', is root' : ''}`)
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
                            log.error(err, log.trace())
            
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
              log.error(err, log.trace())
              req.flash("error_msg", "An error accured")
              return res.redirect("back");
            };
          };
        };
    });
});

router.post("/drop-logs", CheckSetup, ensureIsLoggedIn, SetGeneral, ensureIsAdmin, (req, res) => {
    Log.deleteMany({}, (err) => {
        if(err)
        {
            req.flash("error_msg", "Something went wrong when deleting the logs");
            return res.redirect("/admin");
        }
        else
        {
            req.flash("success_msg", "Logs has been removed");
            setTimeout(() => log.info(`All logs has been cleared`), 3000);
            return res.redirect("back");
        }
    })
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
                    log.info(`User: ${user} was deleted.`)
                    req.flash("success_msg", "User deleted");
                    return res.redirect("back");
                }).catch(e => {
                    log.error(e, log.trace())
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
            log.error(e, log.trace())
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
                            log.info(`Role: ${role} was deleted`);
                            req.flash("success_msg", "Role deleted");
                            return res.redirect("back");
                        }).catch(e => {
                            log.error(e, log.trace())
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
                    log.error(e, log.trace())
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
            log.error(e, log.trace())
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

router.post("/change-name", CheckSetup, ensureIsAdmin, SetGeneral, ensureIsAdmin, (req, res) => {
    let newName = cleanQuery(req.body.name);
    if(newName)
    {
        Settings.find().then(s => {
            if(s.length === 1)
            {
                let oldName = s[0].name;
                s[0].name = newName;
                s[0].save().then(() => {
                    log.info(`Server has changed name to: ${newName}, old name: ${oldName}`);
                    req.flash("success_msg", "Changes made");
                    return res.redirect("back");
                });
            }
            else
            {
                //There is none or more
                log.error(`There are more than 1 setting, one needs to be removed to make this functional`, log.trace());
                req.flash("error_msg", "Something went wrong.. please make an issue at github");
                return res.redirect("back");
            }
        });  
    }
    else
    {
        req.flash("error_msg", "Please define the new name");
        return res.redirect("back");
    }
});

router.post("/change-url", CheckSetup, ensureIsAdmin, SetGeneral, ensureIsAdmin, (req, res) => {
    let newUrl = cleanQuery(req.body.url);
    if(newUrl)
    {
        Settings.find().then(s => {
            if(s.length === 1)
            {
                let oldURL = s[0].url;
                s[0].url = newUrl;
                s[0].save().then(() => {
                    log.info(`Server has changed url to: ${newUrl}, old name: ${oldURL}`);
                    req.flash("success_msg", "Changes made");
                    return res.redirect("back");
                });
            }
            else
            {
                //There is none or more
                log.error(`There are more than 1 setting, one needs to be removed to make this functional`, log.trace());
                req.flash("error_msg", "Something went wrong.. please make an issue at github");
                return res.redirect("back");
            }
        });  
    }
    else
    {
        req.flash("error_msg", "Please define the new URL");
        return res.redirect("back");
    }
});

router.post("/change-logo", CheckSetup, ensureIsAdmin, SetGeneral, ensureIsAdmin, upload.single('file'), (req, res) => {
    let newLogo = req.file;
    let regexImage = /jpeg|gif|jpg|jpeg|png/g;
    if(newLogo)
    {
        if(newLogo.contentType.match(regexImage))
        {
            Settings.find().then(s => {
                if(s.length === 1)
                {
                    let oldLogo = s[0].logo;
                    s[0].logo = newLogo.filename;
                    s[0].save().then(() => {
                        log.info(`Server has changed url to: ${newLogo.filename}, old logo: ${oldLogo}`);
                        req.flash("success_msg", "Changes made");
                        return res.redirect("back");
                    });
                }
                else
                {
                    //There is none or more
                    log.error(`There are more than 1 setting, one needs to be removed to make this functional`, log.trace());
                    req.flash("error_msg", "Something went wrong.. please make an issue at github");
                    return res.redirect("back");
                }
            });  
        }
        else
        {
            req.flash("error_msg", "Only images are allowed");
            return res.redirect("back");
        }
    }
    else
    {
        req.flash("error_msg", "Please define the new logo");
        return res.redirect("back");
    }
});

module.exports = router;