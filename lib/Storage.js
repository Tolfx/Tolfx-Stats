const crypto = require("crypto");
const multer = require("multer");
const gridFsStorage = require("multer-gridfs-storage");
const path = require("path");

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


const upload = multer({ storage: storage });

module.exports = upload;