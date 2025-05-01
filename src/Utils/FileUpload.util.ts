
//Utils/FileUpload.util.ts
import cloudinary from 'cloudinary';
import { config } from 'dotenv';

// Load environment variables
config();

const Cloudinary = cloudinary.v2;

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

export const cloudinaryImageUploadMethod = async (file: string) => {
  return new Promise<string>((resolve, reject) => {
    Cloudinary.uploader.upload(file, { folder:'/body-clone' }, (err, res) => {
      if (err) {
        console.error('Cloudinary Upload Error:', err);
        return reject(`Upload image error: ${err.message}`);
      }
      resolve(res.secure_url);
    });
  });
};
