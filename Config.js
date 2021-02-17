const fs = require('fs');

const Version = (JSON.parse(fs.readFileSync("./package.json"))).version;

module.exports = {
    Version
} 