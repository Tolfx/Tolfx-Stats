const fs = require('fs');
const request = require('request');

const Version = (JSON.parse(fs.readFileSync("./package.json"))).version;
let alreadyCheckedForVersion = false;
const getPackage = require('get-repo-package-json')

function getNewVersion() {
    return new Promise((resolve, reject) => {
        getPackage('https://github.com/Tolfx/Tolfx-Stats').then(pkg => { 
            resolve(pkg)
         })
    });
}

module.exports = {
    Version,
    getNewVersion
} 