"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryImageUploadMethod = void 0;
const tslib_1 = require("tslib");
//Utils/FileUpload.util.ts
const cloudinary_1 = (0, tslib_1.__importDefault)(require("cloudinary"));
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const Cloudinary = cloudinary_1.default.v2;
// Configure Cloudinary with environment variables
Cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});
const cloudinaryImageUploadMethod = async (file) => {
    return new Promise((resolve, reject) => {
        Cloudinary.uploader.upload(file, { folder: '/body-clone' }, (err, res) => {
            if (err) {
                console.error('Cloudinary Upload Error:', err);
                return reject(`Upload image error: ${err.message}`);
            }
            resolve(res.secure_url);
        });
    });
};
exports.cloudinaryImageUploadMethod = cloudinaryImageUploadMethod;
//# sourceMappingURL=FileUpload.util.js.map