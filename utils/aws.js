const { s3 } = require("../config/aws");
const fs = require("fs");
const path = require("path");

const anyadirSignedUrlsPosts = (posts, req) =>
	posts.map((post) => {
		let signedUrlPost;
		let signedUrlAutor;

		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === post.imagen)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === post.imagen);
			signedUrlPost = imagen.signedUrl;
		} else {
			const claveImagen = post.imagen.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrlPost = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 900,
			});

			req.session.signedUrls = (req.session.signedUrls || []).concat([{ imagen: claveImagen, signedUrl: signedUrlPost }]);
		}

		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === post.autor.fotoPerfil)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === post.autor.fotoPerfil);
			signedUrlAutor = imagen.signedUrl;
		} else {
			const claveImagen = post.autor.fotoPerfil.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrlAutor = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 900,
			});

			req.session.signedUrls = (req.session.signedUrls || []).concat([{ imagen: claveImagen, signedUrl: signedUrlAutor }]);
		}

		return { ...(post.toObject ? post.toObject() : post), signedUrlPost, signedUrlAutor };
	});

const anyadirSignedUrlsUsuario = (usuarios, req, mongooseObj = false) =>
	usuarios.map((usuario) => {
		let signedUrlUsuario;

		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === usuario.fotoPerfil)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === usuario.fotoPerfil);
			signedUrlUsuario = imagen.signedUrl;
		} else {
			const claveImagen = usuario.fotoPerfil.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrlUsuario = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 900,
			});

			req.session.signedUrls = (req.session.signedUrls || []).concat([
				{ imagen: claveImagen, signedUrl: signedUrlUsuario },
			]);
		}

		if (mongooseObj) {
			return { ...usuario.toObject(), signedUrlUsuario };
		} else {
			return { ...usuario, signedUrlUsuario };
		}
	});

const subirImagenPredeterminada = async (nombreUsuario) => {
	const rutaImagen = path.join(__dirname, "..", "public", "images", "anonymous.jpg");
	const fileContent = fs.readFileSync(rutaImagen);

	const imagenASubir = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `profileImages/${nombreUsuario}.jpg`,
		Body: fileContent,
		ContentType: "image/jpeg",
	};
	const resultado = await s3.upload(imagenASubir).promise();
	return resultado.Location;
};

module.exports = { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada };
