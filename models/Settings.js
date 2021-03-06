const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({

    url: {
        type: String,
        default: ''
    },

    logo: {
        type: String,
        default: ''
    },

    autoBanOnFail: {
        type: Boolean,
        default: false
    },

    autoBanOnFailAttempts: {
        type: Number,
        default: 5
    },

    name: {
        type: String,
        default: 'Tolfx Stats'
    },

});

const Settings = mongoose.model('settings', SettingsSchema);

module.exports = Settings;