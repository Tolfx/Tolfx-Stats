const log = require("../lib/Loggers");

module.exports = function NodeEventListener()
{
    process.on('exit', (code) => {
        log.error(`About to exit with code ${code}`);
    });

    process.on('unhandledRejection', (reason, promise) => {
        log.error('Unhandled Rejection at: ' + JSON.stringify(promise) + ' reason: ' + reason);
    });

    process.on('uncaughtExceptionMonitor', (err, origin) => {
        log.error(`An error: ${err}.. at ${origin}`);
    });
}