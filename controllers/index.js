const User = require("../models/User");
const Post = require("../models/Post");

const devolverIndex = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/login");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("_id nombre fotoPerfil seguidos tls");

			const autoresPosts = {
				autor: [req.session.idUsuario]
			};
			usuario.seguidos.forEach((usuarioSeguido) => autoresPosts.autor.push(usuarioSeguido));
			const posts = await Post.find(autoresPosts).populate({ path: "autor", select: "nombre fotoPerfil" });
			console.log(posts);

			res.render("index", { usuario: usuario, posts: posts });
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
