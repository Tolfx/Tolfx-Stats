const crypto = require("crypto");
const multer = require("multer");
const util = require("util");
const gridFsStorage = require("multer-gridfs-storage");
const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

/*
// Create storage engine
const storage = new gridFsStorage({
    url: process.env.MONGODB_NAV,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                };

                const filename = buf.toString('hex') + path.extname(file.originalname);

                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };

                resolve(fileInfo);
            });
        });
    }
});
*/

const upload = multer({ storage: storage, onFileUploadStart: function (file) {
    console.log(file.originalname + ' is starting ...')
  }, });

module.exports = upload;