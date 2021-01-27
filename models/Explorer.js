const mongoose = require("mongoose");

const Maps = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    subMap: {
        type: Boolean,
        default: false
    },

    subMapId: {
        type: String,
        required: false
    },

    mapPath: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

});

const Files = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    whichFolderId: {
        type: String,
        required: true
    },

    fileInfo: {
        type: Object,
        required: true
    },

    hasPassword: {
        type: Boolean,
        required: true
    },

    password: {
        type: String,
        required: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },

});

const Map = mongoose.model("maps", Maps);
const File = mongoose.model("files", Files);

module.exports = { Map, File};