const Loggers = require("../models/Logging");
const colors = require("colors");

module.exports = log = {
    debug: (body) => {
        if(process.env.DEBUG) {
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
}

/**
 * 
 * @param {any} body 
 * @param {"verbos" | "debug" | "error"} type 
 */
function logToDB(body, type) {
    if(!process.env.DEBUG) {
        new Loggers({
            message: body,
            type: type
        }).save();
    }
}

function getTime() {
    const D_CurrentDate = new Date;
    let D_CurrentMonth = D_CurrentDate.getMonth()+1;
    let D_CurrentYear = D_CurrentDate.getFullYear();
    let D_CurrentDay = D_CurrentDate.getDay()+1;
    let D_CurrentHour = D_CurrentDate.getHours() != 0 ? D_CurrentDate.getHours() : 00;
    let D_CurrentMinutes = D_CurrentDate.getMinutes() != 0 ? D_CurrentDate.getMinutes() : 00;
    let D_CurrentSeconds = D_CurrentDate.getSeconds() != 0 ? D_CurrentDate.getSeconds(): 00;

    let S_FixedDate = D_CurrentYear + "-" + D_CurrentMonth + "-" + D_CurrentDay + " | " + `${D_CurrentHour}:${D_CurrentMinutes}:${D_CurrentSeconds}`;
    return S_FixedDate;
}