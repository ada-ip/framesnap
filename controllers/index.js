const User = require("../models/User");
const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const { comprobarFavs } = require("../utils/outliers");
const {
	construirFiltroTl,
	ordenarNumSeguidoresPorFecha,
	ordenarNumFavsPorFecha,
	eliminarSugerenciasSeguidos,
} = require("../utils/metodosConsultas");

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
					tls: { $elemMatch: { nombre: req.query.timeline } },
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

			const usuariosRecomendados = await Post.aggregate()
				.match({
					"autor.nombre": { $ne: req.session.usuario },
					fecha: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
				})
				.group({ _id: "$autor.nombre", totalNumFavs: { $sum: "$numFavs" }, fotoPerfil: { $first: "$autor.fotoPerfil" } })
				.project({ _id: 0, nombre: "$_id", totalNumFavs: 1, fotoPerfil: 1 })
				.sort("-totalNumFavs");

			const usuariosRecomendadosNoSeguidos = await eliminarSugerenciasSeguidos(usuariosRecomendados, req.session.idUsuario);

			const usuariosRecomendadosSignedUrls = anyadirSignedUrlsUsuario(usuariosRecomendadosNoSeguidos, req);

			res.render("index", {
				usuario: { ...usuarioConSignedUrls[0], tlElegido: req.query.timeline || "Timeline" },
				posts: postsConFavsYUrls,
				usuariosRecomendados: usuariosRecomendadosSignedUrls,
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
