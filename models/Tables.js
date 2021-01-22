const mongoose = require("mongoose");

const Table = new mongoose.Schema({
    tableName: {
        type: String,
        required: true
    },

    rows: {
        type: Array,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Tables = mongoose.model("table", Table);

const TableData = new mongoose.Schema({
    tableData: {
        type: Array,
        required: true
    },

    tableRow: {
        type: String,
        required: true
    },

    tableConnectId: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TablesData = mongoose.model("tabledata", TableData);

module.exports = { Tables, TablesData };