const Firewall = require("../../models/Firewall");
const log = require("../../lib/Loggers");

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
    new Firewall.blockedIps({
        ip
    }).save().catch(e => {
        log.error(e, log.trace())
    });
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
        Firewall.blockedIps.deleteOne({ ip });
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
    new Firewall.allowedIps({
        ip
    }).save().catch(e => {
        log.error(e, log.trace());
        return false;
    });
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
        Firewall.allowedIps.deleteOne({ ip })
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
        new Firewall.allowedNetworks({
            network
        }).save().catch(e => {
            log.error(e, log.trace());
        });
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

const FireWall = {
    blockedIp,
    blockedNetwork,
    allowedNetwork,
    allowedIp,
    blockIp,
    removeBlockedIp,
    allowIp,
    removeAllowedIp,
    cacheNewData
}

module.exports = FireWall;