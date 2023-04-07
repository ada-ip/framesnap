const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3 } = require("../config/aws");

const subirImagen = multer({
	storage: multerS3({
		s3,
		bucket: process.env.AWS_BUCKET_NAME,
		contentType: (req, imagen, cb) => {
			cb(null, imagen.mimetype);
		},
		key: (req, imagen, cb) => {
			cb(null, `images/${Date.now().toString()}-${imagen.originalname}`);
		}
	}),
	limits: { fileSize: 8000000 }
});

module.exports = subirImagen;
