const User = require("../models/User");
const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const { comprobarFavs } = require("../utils/outliers");
const { construirFiltroTl, ordenarNumSeguidoresPorFecha, ordenarNumFavsPorFecha } = require("../utils/metodosConsultas");

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

			let posts = [];

			if (!req.query.timeline) {
				posts = await usuario.obtenerPostsTimeline();
			} else {
				const tl = await User.findOne({ _id: req.session.idUsuario }).select({
					_id: 0,
					tls: { $elemMatch: { nombre: req.query.timeline } }
				});

				const filtro = construirFiltroTl(tl.tls[0]);

				let orden = tl.tls[0].config.orden;

				if (filtro.$or.length !== 0) {
					posts = await Post.find(filtro)
						.populate({ path: "autor.id", select: "numSeguidores" })
						.select("-favs -outlierComentarios -tags")
						.sort(orden)
						.limit(15);

					if (orden === "autor.id.numSeguidores") ordenarNumSeguidoresPorFecha(posts);
					if (orden === "-autor.id.numSeguidores") ordenarNumSeguidoresPorFecha(posts, false);
					if (orden === "numFavs") ordenarNumFavsPorFecha(posts);
					if (orden === "-numFavs") ordenarNumFavsPorFecha(posts, false);
				}
			}

			const postsConSignedUrls = anyadirSignedUrlsPosts(posts, req);

			const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req);

			res.render("index", {
				usuario: { ...usuarioConSignedUrls[0], tlElegido: req.query.timeline || "Timeline" },
				posts: postsConFavsYUrls
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
