const mongoose = require('mongoose');
const log = require("./Loggers");

mongoose.connect(process.env.MONGODB_NAV, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
let conn = mongoose.connection;

let gfs;

conn.once('open', () => {
    const gridFSBucket = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: "uploads"});
    gfs = gridFSBucket;
});

function GFS_find() {
    return new Promise((resolve, reject) => {

        gfs.find().toArray((err, files) => {
            // Check if files
            if (!files || files.length === 0) {
                return reject("No files exits")
            }
            
            // Files exist
            return resolve(files);
        })
    })
}

function GFS_findOne(fileName) {
    return new Promise((resolve, reject) => { 

        gfs.find({ filename: fileName }, (err, file) => {
            // Check if file
            if (!file || file.length === 0) {
                return reject("No files exits")
            }
            
            // File exists
            return resolve(file);
        });
    })
}

function GFS_DisplayImage(fileName) {
    return new Promise(async (resolve, reject) => {
        try {
            let file = gfs.find({ filename: fileName });
            if(await file.count() === 0)
            {
                reject('No file')
            }
            else
            {
                let image = gfs.openDownloadStreamByName(fileName)
                return resolve(image);
            }

        } catch (err) {
            reject(err)
        }
    });
}

/**
 * 
 * @async
 * @returns true|false 
 */
function GFS_Remove(file) {
    return new Promise((resolve, reject) => {
        gfs.delete(file).then(f => {
            resolve(true)
        }).catch(e => {
            log.error(e.toString(), log.trace());
            resolve(false);
        });
    });
}

module.exports = {
    GFS_find,
    GFS_findOne,
    GFS_DisplayImage,
    GFS_Remove
}