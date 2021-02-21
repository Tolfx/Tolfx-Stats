const log = require("../lib/Loggers");

module.exports = (db) => 
{
    db.on('error', (error) => {
        log.error(error)
        log.error(`Closing application.. cannot run without mongoose.`, log.trace())
        process.exit(1);
    });

    db.on('disconnected', () => {
        log.error(`Got disconneted by mongoDB database..`, log.trace())
        log.error(`Closing application.. cannot run without mongoose.`, log.trace())
        process.exit(1);
    })

    db.once('open', () => {
        log.info("Connected to database");
    });
}