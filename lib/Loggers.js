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

            let time = getTime()

            console.log(time + " | " + colors.cyan(`debug: ${body}`) 
            + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
            logToDB(body, "debug", time);
        }
    },

    verbos: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        let time = getTime()

        console.log(time + " | " + colors.magenta(`verbos: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "verbos", time);
    },

    error: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        let time = getTime()

        console.log(time + " | " + colors.red(`error: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "error", time);
    },

    warning: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        let time = getTime()

        console.log(time + " | " + colors.yellow(`warning: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "warning", time);
    },

    info: (body, trace = '') => {
        let line, lines;
        if(trace.length > 0)
        {
            line = trace;
            lines = line.split("\n")
        }

        let time = getTime()

        console.log(time + " | " + colors.blue(`info: ${body}`)
        + " ", + trace.length > 0 ? lines[2].substring(lines[2].indexOf("("), lines[2].lastIndexOf(")") + 1) : '');
        logToDB(body, "info", time);
    },
}

/**
 * 
 * @param {any} body 
 * @param {"verbos" | "debug" | "error" | "warning" | "info"} type 
 */
function logToDB(body, type, time = '') 
{
    if(process.env.DEBUG != 'true') {
        new Loggers({
            message: body,
            type: type,
            createdAt: time === '' ? Date.now : time
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