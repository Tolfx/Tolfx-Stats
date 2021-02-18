const Roles = require("../models/Roles");
const cleanQuery = require('mongo-sanitize');

function whichType(type, id, search, req)
{
    if(type === 'query')
    {
        let q = {}
        return q = req.query[cleanQuery(search)]
    }

    if(type === 'body')
    {
        let q = {}
        q = req.body[cleanQuery(search)]
        return query = q
    }

    if(type === 'params')
    {
        let q = {}
        q[id] = req.params[cleanQuery(search)]
        return query = q
    }

    if(type === 'none')
    {
        let q = {}
        q[id] = cleanQuery(search)
        return query = q
    }
}

/**
 * 
 * @param {Roles} role 
 * @param {Boolean} warn
 */
function canCreate(role, warn = true)
{
    return (req, res, next) => {
        let userRole = req.user.role;
        role.findOne({ name: userRole }).then(r => {
            if(r.canCreate || r.name === 'admin' || r.root)
            {
                next();
            }
            else
            {
                if(warn)
                {
                    req.flash("error_msg", "You don't have permission to create.");
                }
                return res.redirect("back");
            }
        });
    }
}

/**
 * 
 * @param {Roles} role 
 * @param {Boolean} warn 
 */
function canRemove(role, warn = true)
{
    return (req, res, next) => {
        let userRole = req.user.role;
        role.findOne({ name: userRole }).then(r => {
            if(r)
            {
                if(r.canRemove || r.name === 'admin' || r.root)
                {
                    next();
                }
                else
                {
                    if(warn)
                    {
                        req.flash("error_msg", "You don't have permission to remove.");
                    }
                    return res.redirect("back");
                }
            }
            else
            {
                req.flash("error_msg", `Unable to find role`)
                return res.redirect("back");
            }
        });
    }
}

/**
 * @param {*} model 
 * @param {'query' | 'params' | 'body'} type 
 * @param {Boolean} forward Forwards the user
 * @param {Boolean} warn 
 */
function canRead(model, id, type, search, forward = true, warn = true, callback)
{
    return (req, res, next) => {
        let userRole = req.user.role
        let query = whichType(type, id, search, req);

        try {
            model.findOne(query).then(m => {
                if(m)
                {
                    Roles.findOne({ name: userRole }).then(r => {
                        if(m.readRoles.includes(userRole) || userRole === 'admin' || r.root)
                        {
                            if(forward)
                            {
                                next();
                            }
                            else
                            {
                                callback(true);
                            }
                        }
                        else
                        {
                            if(forward)
                            {
                                if(warn)
                                {
                                    req.flash("error_msg", "You don't have permission to read");
                                }
                                log.warning(`${req.user.username} tried to view ${m.name}`)
                                res.redirect('back');
                                return false
                            }
                            else
                            {
                                log.warning(`${req.user.username} tried to view ${m.name}`)
                                callback(false);
                            }
                        }
                    })
                }
                else
                {
                    log.warning(`${req.user.username} tried to view ${m.name}`)
                    req.flash("error_msg", "Something went wrong.. try again later.")
                    res.redirect('back');
                }
            });
        } catch (e) {
            log.error(e);
            req.flash("error_msg", "Something went wrong.. try again later.")
            res.redirect("back");
        }
    }
}

/**
 * 
 * @param {*} model 
 * @param {'query' | 'params' | 'body'} type 
 * @param {Boolean} forward Forwards the user
 * @param {Boolean} warn 
 */
function canWrite(model, id, type, search, forward = true, warn = true, callback)
{
    return (req, res, next) => {
        let userRole = req.user.role
        let query = whichType(type, id, search, req);
        try {
            model.findOne(query).then(m => {
                if(m)
                {
                    Roles.findOne({name:userRole}).then(r => {
                        if(m.writeRoles.includes(userRole) || userRole === 'admin' || r.root || r.canCreate)
                        {
                            if(forward)
                            {
                                next();
                            }
                            else
                            {
                                callback(true)
                            }
                        }
                        else
                        {
                            if(forward)
                            {
                                if(warn)
                                {
                                    req.flash("error_msg", "You don't have permission to write");
                                }
                                log.warning(`${req.user.username} tried to view ${m.name}`)
                                return res.redirect("back");
                            }
                            else
                            {
                                log.warning(`${req.user.username} tried to view ${m.name}`)
                                callback(false)
                            }
                        }
                    })
                }
                else
                {
                    req.flash("error_msg", "Something went wrong.. try again later.")
                    return res.redirect("back");
                }
            });
        } catch (e)
        {
            log.error(e);
            req.flash("error_msg", "Something went wrong.. try again later.")
            return res.redirect("back");
        }

    }
}

module.exports = {
    canRemove,
    canCreate,
    canWrite,
    canRead
}