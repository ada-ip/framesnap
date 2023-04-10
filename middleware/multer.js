const multer = require("multer");
const { s3 } = require("../config/aws");
const sharp = require("sharp");

const MAX_TAMANYO = 500 * 1024;
const TAMANYO_GRANDE = 5000 * 1024;
const MAX_ANCHO = 1600;

const customStorage = multer.memoryStorage();

const cargarImagen = multer({
	storage: customStorage,
	limits: { fileSize: 8000000 }
});

const subirImagenAS3 = async (req, res, next) => {
	try {
		const imagen = req.file;
		let imagenBuffer = imagen.buffer;

		if (imagen.size > TAMANYO_GRANDE) {
			imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 1600 }).jpeg({ quality: 67 }).toBuffer();
		} else if (imagen.size > MAX_TAMANYO) {
			const metadata = await sharp(imagen.buffer).metadata();
			const ancho = metadata.width;

			if (ancho > MAX_ANCHO) {
				imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 1600 }).jpeg({ quality: 80 }).toBuffer();
			} else {
				imagenBuffer = await sharp(imagen.buffer).rotate().jpeg({ quality: 80 }).toBuffer();
			}
		}

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `images/${Date.now().toString()}-${imagen.originalname}`,
			Body: imagenBuffer,
			ContentType: imagen.mimetype
		};

		s3.upload(params, (error, data) => {
			if (error) {
				throw new Error("No se ha podido subir la imagen a AWS S3");
			}
			req.s3url = data.Location;
			next();
		});
	} catch (error) {
		next(error);
	}
};

module.exports = { cargarImagen, subirImagenAS3 };
