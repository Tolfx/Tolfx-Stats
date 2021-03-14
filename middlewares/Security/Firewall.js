const Firewall = require("../../models/Firewall");
const log = require("../../lib/Loggers");
const { Request, Response } = require("request");
const Settings = require("../../models/Settings");

let settings;

/**
 * @description Contains all blocked IP's
 */
let blockedIp = [];

/**
 * @description Contains all allowed IP's
 */
let allowedIp = [];

/**
 * @description Contains blocked networks
 */
let blockedNetwork = [];

/**
 * @description Contains allowed networks
 */
let allowedNetwork = [];

/**
 * 
 * @param {string} ip 
 */
function blockIp(ip)
{
    blockedIp.push(ip);
}

/**
 * 
 * @param {string} ip 
 */
function removeBlockedIp(ip)
{
    let refrenceBlockedIp = blockedIp;
    let index = refrenceBlockedIp.indexOf(ip);
    if(index > -1)
    {
        blockedIp.slice(index, 1);
        return true;
    }
    else { return false; }
}

/**
 * 
 * @param {string} ip 
 */
function allowIp(ip)
{
    allowedIp.push(ip);
}

/**
 * 
 * @param {string} ip 
 */
function removeAllowedIp(ip)
{
    let refrenceAllowedIp = allowedIp;
    let index = refrenceAllowedIp.indexOf(ip);
    if(index > -1)
    {
        allowedIp.slice(index, 1);
        return true;
    }
    else { return false; }
}

/**
 * 
 * @param {string} network The network address - 192.168.1.0/24
 */
function allowNetwork(network)
{
    let regexIpv4 = /^(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))$/g
    if(network.match(regexIpv4))
    {
        allowedNetwork.push(network);
        return true;
    }
    else
    {
        return false;
    }
}

/**
 * @description Checks for new data and syncs it.
 */
function cacheNewData()
{
    Firewall.allowedIps.find().then(ai => {
        if(ai)
        {
            allowedIp = ai.map(e => e.ip);
        }
    });

    Firewall.allowedNetworks.find().then(an => {
        if(an)
        {
            allowedNetwork = an.map(e => e.network);
        }
    });

    Firewall.blockedIps.find().then(bi => {
        if(bi)
        {
            blockedIp = bi.map(e => e.ip);
        }
    });

    Firewall.blockedNetworks.find().then(bn => {
        if(bn)
        {
            blockedNetwork = bn.map(e => e.network);
        }
    });
}

async function cacheNewSettings() {
    settings = (await Settings.find())[0];
};

(async () => {
    await cacheNewSettings()
    setInterval(() => {
        cacheNewSettings()
    }, 100000)
})();

let attemptsToView = [];

function doGeneral(req, res, next)
{
    let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if(blockedIp.includes(userIp))
    {
        if(!allowedIp.includes(userIp))
        {
            let indexOf = attemptsToView.findIndex(e => e.ip === userIp);
            if(indexOf > -1)
            {
                attemptsToView[indexOf].attempts++;
                if((attemptsToView[indexOf].attempts % 5) == 0)
                {
                    log.warning(`IP: ${userIp} has attempted: ${attemptsToView[indexOf].attempts} times, even if blocked.`)
                }
            }
            else
            {
                attemptsToView.push({
                    ip: userIp,
                    attempts: 0
                });
            }
            return res.status(403).render("partials/banned", {
                ip: userIp,
                general: res.general
            });
        }
        else 
        {
            next();
        }
    }
    else
    {
        next();
    }
}

/**
 * 
 * @param {Request} req 
 * @param {Response} res 
 * @param {*} next 
 */
function FireWall(req, res, next)
{
    if(settings)
    {
        if(settings.onlyAllowedIp)
        {
            let userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            if(!allowedIp.includes(userIp))
            {
                return res.status(403).render("partials/banned", {
                    ip: userIp,
                    general: res.general
                });
            }
            else
            {
                next()
            }
        }
        else
        {
            doGeneral(req, res, next);
        }
    }
    else
    {
        doGeneral(req, res, next);
    }
}

const F = {
    blockedIp,
    blockedNetwork,
    allowedNetwork,
    allowedIp,
    blockIp,
    removeBlockedIp,
    allowIp,
    removeAllowedIp,
    cacheNewData,
    FireWall
}

module.exports = F;