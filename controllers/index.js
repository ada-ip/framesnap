const User = require("../models/User");
const Post = require("../models/Post");

const devolverIndex = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/login");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("_id nombre fotoPerfil seguidos tls");

			if (!usuario) {
				return res.status(404).end();
			}

			const filtro = {};
			if (usuario.tls[0].config.filtro.autor.length > 0) {
				filtro.autor = usuario.tls[0].config.filtro.autor;
			}
			if (usuario.tls[0].config.filtro.tags.length > 0) {
				filtro.tags = usuario.tls[0].config.filtro.tags;
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

			const posts = await Post.find(filtro)
				.populate({
					path: "autor",
					select: "nombre fotoPerfil"
				})
				.sort(orden);

			res.render("index", { usuario: usuario, posts: posts });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
