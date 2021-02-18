const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    root: {
        type: Boolean,
        default: false
    },

    canCreate: {
        type: Boolean,
        default: false,
    },

    canRemove: {
        type: Boolean,
        default: false
    },

});

const Roles = mongoose.model('roles', RoleSchema);

module.exports = Roles;