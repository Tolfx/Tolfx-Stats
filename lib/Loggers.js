const Loggers = require("../models/Logging");
const colors = require("colors");
const dateFormat = require("date-and-time");

module.exports = log = {
    debug: (body) => {
        if(process.env.DEBUG === 'true') {
            console.log(getTime() + " | " + colors.cyan(`debug: ${body}`));
            logToDB(body, "debug");
        }
    },

    verbos: (body) => {
        console.log(getTime() + " | " + colors.magenta(`verbos: ${body}`));
        logToDB(body, "verbos");
    },

    error: (body) => {
        console.log(getTime() + " | " + colors.red(`error: ${body}`));
        logToDB(body, "error");
    },

    warning: (body) => {
        console.log(getTime() + " | " + colors.yellow(`warning: ${body}`));
        logToDB(body, "warning");
    },

    info: (body) => {
        console.log(getTime() + " | " + colors.blue(`info: ${body}`));
        logToDB(body, "info");
    },
}

/**
 * 
 * @param {any} body 
 * @param {"verbos" | "debug" | "error" | "warning" | "info"} type 
 */
function logToDB(body, type) {
    if(process.env.DEBUG != 'true') {
        new Loggers({
            message: body,
            type: type
        }).save();
    }
}

function getTime() {
    const D_CurrentDate = new Date();

    let S_FixedDate = dateFormat.format(D_CurrentDate, "YYYY-MM-DD HH:mm:ss");
    return S_FixedDate;
}