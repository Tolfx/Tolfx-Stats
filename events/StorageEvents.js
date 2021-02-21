const log = require("../lib/Loggers");

module.exports = (storage) => {
    storage.on("file", (file) => {
        log.info(`New file was created with name: ` + (file).filename);
    });
    
    storage.on("streamError", (error, conf) => {
        log.error(error, log.trace())
    });
}