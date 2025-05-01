
//Middleware/multer.middleware.ts
import multer from 'multer';
import path from 'path';

// Configure multer storage (store temporarily before uploading to Cloudinary)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Temporary folder (will be deleted after Cloudinary upload)
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Multer middleware
const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);

        if (extName && mimeType) {
            return cb(null, true);
        } else {
            return cb(new Error('Only images are allowed!'), false);
        }
    }
});

export default upload;
