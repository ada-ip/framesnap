/**
 * Funciones para gestionar las imágenes almacenadas en Amazon Web Services S3.
 *
 * Este módulo contiene funciones auxiliares para, por ejemplo, poder recuperar y mostrar imágenes
 * almacenadas en un bucket privado de AWS S3, o subir una imagen de perfil predeterminada al bucket.
 *
 * Funciones:
 * - anyadirSignedUrlsPosts: Pide y añade a un conjunto de posts, las URLs públicas temporales de sus imágenes y de las imágenes
 * 							 de perfil de sus creadores.
 * - anyadirSignedUrlsUsuario: Pide y añade a un conjunto de usuarios, las URLs públicas temporales de sus imágenes de perfil.
 * - subirImagenPredeterminada: Sube al bucket de S3 una imagen de perfil predeterminada asociada al usuario.
 */

// Se importan los módulos necesarios
const { s3 } = require("../config/aws");
const fs = require("fs");
const path = require("path");

/**
 * Pide y añade a un conjunto de posts, las URLs públicas temporales de sus imágenes y de las imágenes de perfil de sus creadores.
 *
 * @param {Array.<Object>} posts	Un array de posts (resultado de una consulta a la colección posts de la base de datos) que tienen
 * 									como mínimo las siguientes propiedades:
 * 									- imagen: la URL privada de la imagen del post en el bucket de S3.
 * 									- autor: Un objeto que representa el autor del post con al menos la siguiente propiedad:
 *                                  		- fotoPerfil: la URL privada de la imagen de perfil del autor en el bucket de S3.
 * @param {Request} req				Un objeto Request de Express que representa la petición enviada por el cliente.
 * @returns {Array.<Object>}		Un array de posts con las propiedades signedUrlPost y signedUrlAutor añadidas.
 */
const anyadirSignedUrlsPosts = (posts, req) =>
	posts.map((post) => {
		let signedUrlPost;
		let signedUrlAutor;

		/* Se eliminan de la sesión las URL públicas que ya hayan caducado o se crea la variable de sesión si todavía
		no se ha guardado ninguna URL */
		if (req.session.signedUrls) {
			req.session.signedUrls = req.session.signedUrls.filter((signedUrl) => signedUrl.caducidad > Date.now());
		} else {
			req.session.signedUrls = [];
		}

		/* Se comprueba si la URL pública temporal de la imagen de perfil del autor del post se encuentra en la variable de sesión signedUrls,
		y si se encuentra en la variable se almacena directamente */
		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === post.autor.fotoPerfil)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === post.autor.fotoPerfil);
			signedUrlAutor = imagen.signedUrl;
			// Si no se pide una URL pública temporal
		} else {
			const claveImagen = post.autor.fotoPerfil.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrlAutor = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 1200, // la URL pública caduca en 20 minutos
			});

			// Se guarda la URL pública en la variable de sesión
			req.session.signedUrls = req.session.signedUrls.concat([
				{ imagen: post.autor.fotoPerfil, signedUrl: signedUrlAutor, caducidad: Date.now() + 1200 * 1000 },
			]);
		}

		/* En el caso de la imagen del post, no se guardan la URLs públicas en la variable de sesión porque van
		a tener poca repetición en la aplicación por lo que se pide una URL pública directamente */
		const claveImagen = post.imagen.replace(
			`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
			""
		);

		signedUrlPost = s3.getSignedUrl("getObject", {
			Bucket: process.env.AWS_BUCKET_NAME,
			Key: claveImagen,
			Expires: 1200,
		});

		// Se devuelve el objeto con las dos propiedades añadidas
		return { ...(post.toObject ? post.toObject() : post), signedUrlPost, signedUrlAutor };
	});

/**
 * Pide y añade a un conjunto de usuarios, las URLs públicas temporales de sus imágenes de perfil.
 *
 * @param {Array.<Object>} usuarios		Un array de usuarios (resultado de una consulta a la colección users de la base de datos)
 * 										que tienen como mínimo la siguiente propiedad:
 * 										- fotoPerfil: la URL privada de la imagen de perfil del usuario en el bucket de S3.
 * @param {Request} req					Un objeto Request de Express que representa la petición enviada por el cliente.
 * @returns {Array.<Object>}			Un array de usuarios con la propiedad signedUrlUsuario añadida.
 */
const anyadirSignedUrlsUsuario = (usuarios, req) =>
	usuarios.map((usuario) => {
		let signedUrlUsuario;

		/* Se eliminan de la sesión las URL públicas que ya hayan caducado o se crea la variable de sesión si todavía
		no se ha guardado ninguna URL */
		if (req.session.signedUrls) {
			req.session.signedUrls = req.session.signedUrls.filter((signedUrl) => signedUrl.caducidad > Date.now());
		} else {
			req.session.signedUrls = [];
		}

		/* Se comprueba si la URL pública temporal de la imagen se encuentra en la variable de sesión signedUrls,
		y si se encuentra en la variable se almacena directamente */
		if (req.session.signedUrls && req.session.signedUrls.some((signedUrl) => signedUrl.imagen === usuario.fotoPerfil)) {
			const imagen = req.session.signedUrls.find((signedUrl) => signedUrl.imagen === usuario.fotoPerfil);
			signedUrlUsuario = imagen.signedUrl;
			// Si no, se pide una nueva signedUrl
		} else {
			const claveImagen = usuario.fotoPerfil.replace(
				`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/`,
				""
			);

			signedUrlUsuario = s3.getSignedUrl("getObject", {
				Bucket: process.env.AWS_BUCKET_NAME,
				Key: claveImagen,
				Expires: 1200,
			});

			// Se guarda la URL pública en la variable de sesión signedUrls
			req.session.signedUrls = req.session.signedUrls.concat([
				{ imagen: usuario.fotoPerfil, signedUrl: signedUrlUsuario, caducidad: Date.now() + 1200 * 1000 },
			]);
		}

		// Se devuelve el objeto con la propiedad signedUrlUsuario añadida.
		return { ...(usuario.toObject ? usuario.toObject() : usuario), signedUrlUsuario };
	});

/**
 * Sube al bucket de S3 una imagen de perfil predeterminada asociada al usuario.
 *
 * @async
 * @param {String} nombreUsuario	El nombre del usuario cuya foto de perfil se quiere subir a S3.
 * @returns {Promise<string>} 	 	Una promesa que envuelve a la URL privada de la imagen subida a S3.
 * @throws {Error} 					Lanza un error si ocurre algún problema al subir la imagen a S3.
 */
const subirImagenPredeterminada = async (nombreUsuario) => {
	const rutaImagen = path.join(__dirname, "..", "public", "images", "anonymous.jpg"); // La ruta de la imagen predeterminada a subir
	const fileContent = fs.readFileSync(rutaImagen); // Se abre la imagen y se guarda su contenido como buffer

	// Se sube la imagen a S3
	const imagenASubir = {
		Bucket: process.env.AWS_BUCKET_NAME,
		Key: `profileImages/${nombreUsuario}.jpg`,
		Body: fileContent,
		ContentType: "image/jpeg",
	};
	const resultado = await s3.upload(imagenASubir).promise();

	// Se devuelve la URL privada de la imagen en S3.
	return resultado.Location;
};

module.exports = { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada };
