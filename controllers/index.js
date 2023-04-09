const User = require("../models/User");
const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");

const devolverIndex = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("_id nombre fotoPerfil tls");

			if (!usuario) {
				return res.status(404).end();
			}

			const usuarioConSignedUrls = anyadirSignedUrlsUsuario(usuario, req);

			const filtro = {};
			if (usuario.tls[0].config.filtro.autor.length > 0) {
				filtro["autor.id"] = [];
				for (let autor of usuario.tls[0].config.filtro.autor) {
					filtro["autor.id"].push(autor);
				}
			}
			if (usuario.tls[0].config.filtro.tags.length > 0) {
				filtro.tags = [];
				for (let tag of usuario.tls[0].config.filtro.tags) {
					filtro.tags.push(tag);
				}
			}
			if (usuario.tls[0].config.filtro.fecha) {
				filtro.fecha = usuario.tls[0].config.filtro.fecha;
			}

			let orden = "";
			if (usuario.tls[0].config.orden.length > 0) {
				for (let campo of usuario.tls[0].config.orden) {
					orden += campo + " ";
				}
			}

			const posts = await Post.find(filtro).sort(orden);

			const postsConSignedUrls = anyadirSignedUrlsPosts(posts, req);

			res.render("index", { usuario: usuarioConSignedUrls, posts: postsConSignedUrls });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
