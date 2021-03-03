const mongoose = require("mongoose");

const blockedIp = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const allowedIp = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const blockedNetwork = new mongoose.Schema({
    network: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const allowedNetwork = new mongoose.Schema({
    network: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

const blockedIps = mongoose.model("blockedips", blockedIp);
const allowedIps = mongoose.model("allowedips", allowedIp);
const blockedNetworks = mongoose.model("blockednetwork", blockedNetwork);
const allowedNetworks = mongoose.model("allowednetwork", allowedNetwork);

const Firewall = {
    blockedIps,
    allowedIps,
    blockedNetworks,
    allowedNetworks
}

module.exports = Firewall;