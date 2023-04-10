const Post = require("../models/Post");

const crearPost = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		const post = {
			imagen: req.s3url,
			texto: req.body.texto,
			autor: {
				id: req.session.idUsuario,
				nombre: req.session.usuario,
				fotoPerfil: req.session.fotoPerfil
			},
			favs: [],
			comentarios: [],
			tags: req.body.texto.split(" ").filter((palabra) => palabra.startsWith("#"))
		};

		try {
			const nuevoPost = new Post(post);
			await nuevoPost.save();
			res.redirect("/");
		} catch (error) {
			next(error);
		}
	}
};

module.exports = crearPost;
