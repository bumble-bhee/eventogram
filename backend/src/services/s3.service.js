const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Create S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// File filter - only allow images and videos
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only images and videos are allowed!'), false);
    }
};

// Multer-S3 upload configuration
const upload = multer({
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,  // 50MB per file
        files: 100                    // max 100 files
    },
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            let folder = 'general';
            if (req.params.eventId) {
                folder = `events/${req.params.eventId}`;
            } else if (req.path && req.path.includes('avatar')) {
                folder = `avatars`;
            }
            const uniqueName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
            cb(null, uniqueName);
        }
    })
});

// Delete file from S3
const deleteFromS3 = async (key) => {
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key
        });
        await s3Client.send(command);
        console.log(`Deleted from S3: ${key}`);
    } catch (error) {
        console.error('S3 delete error:', error);
        throw error;
    }
};

module.exports = { upload, deleteFromS3, s3Client };