const multer = require('multer')


function randomString(lenth) {
  let result = '';
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < lenth; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary only if the URL is provided (i.e. in production)
if (process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

let storage;

const fs = require('fs');
if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Use Cloudinary in production
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'airbnb-clone',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  });
} else {
  // Fallback to local storage for development
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = "uploads/";
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, randomString(10) + '-' + file.originalname);
    }
  });
}

const multerOption = {
  storage: storage,
  fileFilter: fileFilter
}


module.exports = multerOption ;
