/**
 * Este módulo define un conjunto de middlewares para manejar la subida de imágenes a AWS S3.
 * También, se define un tamaño mediano, grande y muy grande para categorizar las imágenes y procesarlas adecuadamente.
 *
 * Middlewares:
 * - subirImagenAS3: Comprime una imagen proporcionada por el usuario y la sube al bucket privado de AWS S3.
 * - subirFotoPerfilAS3: Comprime una imagen proporcionada por el usuario como nueva foto de perfil y la sube al bucket privado
 * 						 de AWS S3.
 */

// Se importan los módulos necesarios para el procesamiento de las imágenes
const multer = require("multer");
const { s3 } = require("../config/aws");
const sharp = require("sharp");

// Categorías de imágenes
const TAMANYO_MEDIANO = 200 * 1024;
const TAMANYO_GRANDE = 1000 * 1024;
const TAMANYO_MUY_GRANDE = 1700 * 1024;
const MAX_ANCHO = 1200;

const customStorage = multer.memoryStorage();

const cargarImagen = multer({
	storage: customStorage,
	limits: { fileSize: 10000000 },
});

const subirImagenAS3 = async (req, res, next) => {
	try {
		const imagen = req.file;
		let imagenBuffer = imagen.buffer;

		if (imagen.mimetype === "image/png") {
			imagenBuffer = await sharp(imagen.buffer).toFormat("jpeg").toBuffer();
		}

		if (imagen.size > TAMANYO_MUY_GRANDE) {
			imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 1200 }).jpeg({ quality: 50 }).toBuffer();
		} else if (imagen.size > TAMANYO_GRANDE) {
			imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 1200 }).jpeg({ quality: 65 }).toBuffer();
		} else if (imagen.size > TAMANYO_MEDIANO) {
			const metadata = await sharp(imagen.buffer).metadata();
			const ancho = metadata.width;

			if (ancho > MAX_ANCHO) {
				imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 1200 }).jpeg({ quality: 70 }).toBuffer();
			} else {
				imagenBuffer = await sharp(imagen.buffer).rotate().jpeg({ quality: 80 }).toBuffer();
			}
		}

		const nombreImagenJPG = imagen.originalname.replace(/\.[a-z]+$/i, ".jpg").replace(/[^a-zA-Z0-9\-_.]/g, "_");

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `images/${Date.now().toString()}-${nombreImagenJPG}`,
			Body: imagenBuffer,
			ContentType: "image/jpeg",
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

const subirFotoPerfilAS3 = async (req, res, next) => {
	try {
		const imagen = req.file;
		let imagenBuffer = imagen.buffer;

		if (imagen.mimetype === "image/png") {
			imagenBuffer = await sharp(imagen.buffer).toFormat("jpeg").toBuffer();
		}

		if (imagen.size > TAMANYO_MUY_GRANDE) {
			imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 200 }).jpeg({ quality: 80 }).toBuffer();
		} else {
			imagenBuffer = await sharp(imagen.buffer).rotate().resize({ width: 200 }).jpeg({ quality: 100 }).toBuffer();
		}

		const nombreImagenJPG = req.session.usuario + ".jpg";

		const params = {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: `profileImages/${nombreImagenJPG}`,
			Body: imagenBuffer,
			ContentType: "image/jpeg",
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

module.exports = { cargarImagen, subirImagenAS3, subirFotoPerfilAS3 };
