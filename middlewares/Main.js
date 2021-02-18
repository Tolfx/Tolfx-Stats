const CheckSetup = require("./CheckSetup");
const SetGeneral = require("./SetGeneral");
const Pagination = require("./Pagination");
const CanRemove = require("./Permissions").canRemove
const CanCreate = require("./Permissions").canCreate
const CanWrite = require("./Permissions").canWrite
const CanRead = require("./Permissions").canRead

module.exports = {
    CheckSetup,
    SetGeneral,
    Pagination,
    CanRemove,
    CanCreate,
    CanRead,
    CanWrite
}