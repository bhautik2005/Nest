const multer = require('multer')


function randomString(lenth) {
  let result = '';
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < lenth; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const fileFlter = (req,file,cd)=>{
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cd(null, true);
  } else {
    cd(null, false);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + '-' + file.originalname);
  }
});

const multerOption = {
  storage,fileFlter
}


module.exports = multerOption ;
