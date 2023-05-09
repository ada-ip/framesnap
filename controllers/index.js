const User = require("../models/User");
const Post = require("../models/Post");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const { construirFiltroTl, eliminarSugerenciasSeguidos, comprobarFavs } = require("../utils/consultas");

const devolverIndex = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select(
				"_id nombre fotoPerfil seguidos outlierSeguidos tls"
			);

			if (!usuario) {
				return res.status(404).end();
			}

			const usuarioConSignedUrls = anyadirSignedUrlsUsuario([usuario.toObject()], req);

			let posts = [];
			let orden = "-fecha";

			if (!req.query.timeline) {
				posts = await usuario.obtenerPostsTimeline();
			} else {
				const tl = await User.findById(req.session.idUsuario).select({
					_id: 0,
					tls: { $elemMatch: { nombre: req.query.timeline } },
				});

				const filtro = construirFiltroTl(tl.tls[0]);

				orden = tl.tls[0].config.orden;
				if (orden !== "fecha" && orden !== "-fecha") orden += " -fecha";

				if (
					filtro.$or.length !== 0 &&
					(tl.tls[0].config.orden === "-numSeguidores" || tl.tls[0].config.orden === "numSeguidores")
				) {
					posts = await Post.aggregate()
						.match(filtro)
						.lookup({ from: "users", localField: "autor.id", foreignField: "_id", as: "datosAutor" })
						.unwind("$datosAutor")
						.project({
							_id: 1,
							imagen: 1,
							texto: 1,
							autor: 1,
							outlierFavs: 1,
							numFavs: 1,
							comentarios: 1,
							fecha: 1,
							numSeguidores: "$datosAutor.numSeguidores",
						})
						.sort(orden)
						.limit(10);
				} else {
					posts = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden).limit(10);
				}
			}

			const postsConSignedUrls = anyadirSignedUrlsPosts(posts, req);

			const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req.session.idUsuario);

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
				usuario: {
					...usuarioConSignedUrls[0],
					tlElegido: req.query.timeline || "Timeline",
					ordenTl: orden.substring(0, orden.includes(" ") ? orden.indexOf(" ") : orden.length),
				},
				posts: postsConFavsYUrls,
				usuariosRecomendados: usuariosRecomendadosSignedUrls,
			});
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
