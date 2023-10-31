const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const { environment } = require("../env");
var _storage;
const MulterImg = async (req, res, pathblog) => {
  
  _storage = multer.diskStorage({
    destination(req, file, callback) {
    
      callback(null, pathblog);
    },
    filename(req, file, callback) {
      callback(null, `${Date.now()}_${file.originalname}`);
    },
  });

  return _storage;
};

module.exports = {
  MulterImg,
  _storage,
  multer,
};
