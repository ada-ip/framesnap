const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");

const crearPost = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		const tags = req.body.texto.split(" ").reduce((tags, palabra) => {
			if (palabra.startsWith("#")) {
				tags.push(palabra.substring(1));
			}
			return tags;
		}, []);

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
			tags: tags
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

const obtenerPosts = async (req, res, next) => {
	const tag = req.query.q;

	try {
		const posts = await Post.find({ tags: tag, fecha: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
			.select("_id imagen texto autor numFavs comentarios fecha")
			.sort("-numFavs -fecha");

		const postsConSignedUrl = anyadirSignedUrlsPosts(posts, req);

		const usuarioLogeado = anyadirSignedUrlsUsuario(
			[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
			req
		);

		res.render("busquedaPosts", { posts: postsConSignedUrl, usuarioLogeado: usuarioLogeado[0] });
	} catch (error) {
		next(error);
	}
};

module.exports = { crearPost, obtenerPosts };
