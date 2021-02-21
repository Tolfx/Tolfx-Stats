const Loggers = require("../models/Logging");
const colors = require("colors");
const dateFormat = require("date-and-time");

module.exports = log = {
    trace: trace,

    debug: (body, trace = '') => {
        if(process.env.DEBUG === 'true') {
            let line, lines;
            if(trace.length > 0)
            {
                line = trace;
                lines = line.split("\n")
            }

            console.log(getTime() + " | " + colors.cyan(`debug: ${body}`) 
            + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
            logToDB(body, "debug");
        }
    },

    verbos: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        console.log(getTime() + " | " + colors.magenta(`verbos: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "verbos");
    },

    error: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        console.log(getTime() + " | " + colors.red(`error: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "error");
    },

    warning: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        console.log(getTime() + " | " + colors.yellow(`warning: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "warning");
    },

    info: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        console.log(getTime() + " | " + colors.blue(`info: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "info");
    },
}

/**
 * 
 * @param {any} body 
 * @param {"verbos" | "debug" | "error" | "warning" | "info"} type 
 */
function logToDB(body, type) 
{
    if(process.env.DEBUG != 'true') {
        new Loggers({
            message: body,
            type: type
        }).save();
    }
}

function trace()
{
    var err = new Error();
    return err.stack;
}

function getTime() 
{
    const D_CurrentDate = new Date();

    let S_FixedDate = dateFormat.format(D_CurrentDate, "YYYY-MM-DD HH:mm:ss");
    return S_FixedDate;
}