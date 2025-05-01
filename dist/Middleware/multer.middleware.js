"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
//Middleware/multer.middleware.ts
const multer_1 = (0, tslib_1.__importDefault)(require("multer"));
const path_1 = (0, tslib_1.__importDefault)(require("path"));
// Configure multer storage (store temporarily before uploading to Cloudinary)
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Temporary folder (will be deleted after Cloudinary upload)
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
// Multer middleware
const upload = (0, multer_1.default)({
    storage,
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extName = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimeType = allowedTypes.test(file.mimetype);
        if (extName && mimeType) {
            return cb(null, true);
        }
        else {
            return cb(new Error('Only images are allowed!'), false);
        }
    }
});
exports.default = upload;
//# sourceMappingURL=multer.middleware.js.map