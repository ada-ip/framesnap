const Post = require("../models/Post");

const crearPost = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		const post = {
			imagen: req.file.location,
			texto: req.body.texto,
			autor: req.session.idUsuario,
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
