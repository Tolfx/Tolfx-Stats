const mongoose = require("mongoose");

const Logging = new mongoose.Schema({
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Log = mongoose.model("Logs", Logging);

module.exports = Log;