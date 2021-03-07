const fs = require('fs');
const request = require('request');

const Version = (JSON.parse(fs.readFileSync("./package.json"))).version;
const Port = process.env.PORT;
let alreadyCheckedForVersion = false;
const getPackage = require('get-repo-package-json')

function getNewVersion() {
    return new Promise((resolve, reject) => {
        if(!alreadyCheckedForVersion)
        {
            getPackage('https://github.com/Tolfx/Tolfx-Stats').then(pkg => { 
                resolve(pkg)
                alreadyCheckedForVersion = true
            }).catch(e => {
                resolve(false)
            })
        }
        else
        {
            resolve(false)
        }
    });

}

module.exports = {
    Version,
    Port,
    getNewVersion
} 