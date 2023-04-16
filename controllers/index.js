const User = require("../models/User");
const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const { comprobarFavs } = require("../utils/outliers");

const devolverIndex = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("_id nombre fotoPerfil seguidos tls");

			if (!usuario) {
				return res.status(404).end();
			}

			const usuarioConSignedUrls = anyadirSignedUrlsUsuario([usuario.toObject()], req);

			// const filtro = {};
			// if (usuario.tls[0].config.filtro.autor.length > 0) {
			// 	filtro["autor.id"] = {
			// 		$in: []
			// 	};
			// 	for (let autor of usuario.tls[0].config.filtro.autor) {
			// 		filtro["autor.id"].$in.push(autor);
			// 	}
			// }
			// if (usuario.tls[0].config.filtro.tags.length > 0) {
			// 	filtro.tags = {
			// 		$in: []
			// 	};
			// 	for (let tag of usuario.tls[0].config.filtro.tags) {
			// 		filtro.tags.$in.push(tag);
			// 	}
			// }
			// if (usuario.tls[0].config.filtro.fecha) {
			// 	filtro.fecha = usuario.tls[0].config.filtro.fecha;
			// }

			// let orden = "";
			// if (usuario.tls[0].config.orden.length > 0) {
			// 	for (let campo of usuario.tls[0].config.orden) {
			// 		orden += campo + " ";
			// 	}
			// }

			// const posts = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden);

			const posts = await usuario.obtenerPostsTimeline();

			const postsConSignedUrls = anyadirSignedUrlsPosts(posts, req);

			const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req);

			res.render("index", { usuario: { ...usuarioConSignedUrls[0], tlElegido: "Timeline" }, posts: postsConFavsYUrls });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
