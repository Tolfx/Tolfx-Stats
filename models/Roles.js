const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

});

const Roles = mongoose.model('roles', RoleSchema);

module.exports = Roles;