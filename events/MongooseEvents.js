const log = require("../lib/Loggers");
const { cacheNewData } = require("../middlewares/Security/Firewall");

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

        /**
         * Cache new data here
         * for IPs and networks.
         */
        log.info("Caching new data for IP's");
        cacheNewData();
    });
}