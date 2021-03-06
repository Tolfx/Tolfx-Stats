const { Request, Response } = require("express");
const Settings = require("../../models/Settings");
const Firewall = require("./Firewall");
const FirewallModel = require("../../models/Firewall");
const log = require("../../lib/Loggers");

let failedAttempts = [];

function cacheNewSettings()
{
    return new Promise(async (resolve, reject) => {
        let s = await Settings.find();
        resolve(s);
    });
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
module.exports = (req, res, next) => {
    cacheNewSettings().then(settings => {
        let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if(settings[0].autoBanOnFail && !Firewall.allowedIp.includes(userIp))
        {
            if(!req.isAuthenticated() && req.originalUrl != "/")
            {
                let indexOf = failedAttempts.findIndex(e => e.ip === userIp);
                if(indexOf > -1)
                {
                    failedAttempts[indexOf].attempt++;
                    if(failedAttempts[indexOf].attempt > settings[0].autoBanOnFailAttempts)
                    {
                        log.info(`${userIp} has been auto banned.`)
                        Firewall.blockIp(userIp);
                        new FirewallModel.blockedIps({
                            ip: userIp
                        }).save();
                    }
                }
                else
                {
                    failedAttempts.push({
                        ip: userIp,
                        attempt: 1
                    });
                }
            }
        }
    });
    next();
};