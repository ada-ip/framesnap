/**
 * Este módulo contiene una función que renderiza la página principal de un usuario de la aplicación.
 *
 * Funciones:
 * - devolverIndex: Construye y devuelve la página principal del usuario con todos sus datos.
 */

// Se importan los modelos de Mongoose necesarios
const User = require("../models/User");
const Post = require("../models/Post");

// Se importan las funciones necesarias para construir el index
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const { construirFiltroTl, eliminarSugerenciasSeguidos, comprobarFavs } = require("../utils/consultas");

const devolverIndex = async (req, res, next) => {
	try {
		// Primero se obtienen todos los datos necesarios del usuario de su documento de la colección users de la BBDD.
		const usuario = await User.findById(req.session.idUsuario).select("_id nombre fotoPerfil seguidos outlierSeguidos tls");
		if (!usuario) {
			throw new Error("El usuario de la sesión no existe");
		}
		const usuarioConSignedUrls = anyadirSignedUrlsUsuario([usuario], req);

		let posts = [];
		let orden = "-fecha";

		/* Se obtienen los posts del timeline estandar del usuario o del timeline elegido expresamente por el usuario
		si ha elegido un timeline en particular */
		if (!req.query.timeline) {
			posts = await usuario.obtenerPostsTimeline();
		} else {
			/* Si el usuario ha elegido un timeline personalizado se construye el filtro para poder obtener los posts
			necesarios de la base de datos */
			const tl = await User.findById(req.session.idUsuario).select({
				_id: 0,
				tls: { $elemMatch: { nombre: req.query.timeline } },
			});
			const filtro = construirFiltroTl(tl.tls[0]);

			orden = tl.tls[0].config.orden;
			if (orden !== "fecha" && orden !== "-fecha") orden += " -fecha";

			// Se obtienen los posts correspondientes al timeline elegido por el usuario
			if (filtro.$or.length !== 0) {
				if (tl.tls[0].config.orden === "-numSeguidores" || tl.tls[0].config.orden === "numSeguidores") {
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
		}

		/* Se añade a cada post su url pública firmada y una propiedad que indica si el usuario conectado ha marcado
		como favorito dicho post */
		const postsConSignedUrls = anyadirSignedUrlsPosts(posts, req);
		const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req.session.idUsuario);

		// Se obtiene una lista con los usuarios que han obtenido más favoritos a lo largo del mes
		const usuariosRecomendados = await Post.aggregate()
			.match({
				"autor.nombre": { $ne: req.session.usuario },
				fecha: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) },
			})
			.group({ _id: "$autor.nombre", totalNumFavs: { $sum: "$numFavs" }, fotoPerfil: { $first: "$autor.fotoPerfil" } })
			.project({ _id: 0, nombre: "$_id", totalNumFavs: 1, fotoPerfil: 1 })
			.sort("-totalNumFavs")
			.limit(20);

		/* Se quitan de la lista de usuarios los usuarios a los que ya sigue el usuario conectado y se añaden las url públicas
		firmadas de sus fotos de perfil */
		const usuariosRecomendadosNoSeguidos = await eliminarSugerenciasSeguidos(usuariosRecomendados, req.session.idUsuario);
		const usuariosRecomendadosSignedUrls = anyadirSignedUrlsUsuario(usuariosRecomendadosNoSeguidos, req);

		/* Se renderiza el index con los datos del usuario, los últimos posts correspondientes al timeline elegido, y los
		usuarios a los que se recomienda que siga el usuario */
		res.render("index", {
			usuario: {
				...usuarioConSignedUrls[0],
				tlElegido: req.query.timeline || "Timeline",
				ordenTl: orden.substring(0, orden.includes(" ") ? orden.indexOf(" ") : orden.length),
			},
			posts: postsConFavsYUrls,
			usuariosRecomendados: usuariosRecomendadosSignedUrls.slice(0, 8),
		});
	} catch (error) {
		next(error);
	}
};

module.exports = devolverIndex;
