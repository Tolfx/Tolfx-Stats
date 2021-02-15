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

    name: {
        type: String,
        default: 'Tolfx Stats'
    },

});

const Settings = mongoose.model('settings', SettingsSchema);

module.exports = Settings;