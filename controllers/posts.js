const Post = require("../models/Post");
const User = require("../models/User");
const Fav = require("../models/Fav");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
const {
	construirFiltroTl,
	obtenerMasPostsPorNumSeguidores,
	obtenerMasPostsPorNumFavs,
	comprobarFavs,
} = require("../utils/consultas");
const LIMITE_ELEMENTOS = 1000;

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
				fotoPerfil: req.session.fotoPerfil,
			},
			favs: [],
			comentarios: [],
			tags: tags,
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

const obtenerPostsPorTag = async (req, res, next) => {
	const fechaPosts = req.query.fechaPosts || req.body.fechaPosts;
	const tag = req.query.q || req.body.q;
	const { fechaUltimoPost, numFavs } = req.body;

	const tiempo = {
		dia: 1,
		semana: 7,
		mes: 30,
		tmes: 3 * 30,
		smes: 6 * 30,
		anyo: 365,
	};

	const filtroFecha = {
		$gte: new Date(Date.now() - 24 * 60 * 60 * 1000 * tiempo[fechaPosts || "mes"]),
	};

	const filtro = {
		tags: tag,
		fecha: {
			$gte: new Date(Date.now() - 24 * 60 * 60 * 1000 * tiempo[fechaPosts || "mes"]),
		},
	};
	if (numFavs) {
		filtro.numFavs = { $eq: numFavs };
		filtro.fecha.$lt = new Date(fechaUltimoPost);
	}

	try {
		const posts = await Post.find(filtro)
			.select("_id imagen texto autor numFavs comentarios fecha")
			.sort("-numFavs -fecha")
			.limit(10);

		if (posts.length < 10 && numFavs) {
			filtro.numFavs = { $lt: numFavs };
			delete filtro.fecha.$lt;
			const otrosPosts = await Post.find(filtro)
				.select("_id imagen texto autor numFavs comentarios fecha")
				.sort("-numFavs -fecha")
				.limit(10);

			posts.push(...otrosPosts);
		}

		const postsConSignedUrl = anyadirSignedUrlsPosts(posts, req);

		if (!numFavs) {
			const usuarioLogeado = anyadirSignedUrlsUsuario(
				[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
				req
			);

			res.render("busquedaPosts", {
				posts: postsConSignedUrl,
				usuarioLogeado: usuarioLogeado[0],
				fechaPosts: fechaPosts,
				tag: tag,
			});
		} else {
			res.status(200).json(postsConSignedUrl);
		}
	} catch (error) {
		next(error);
	}
};

const favoritearPost = async (req, res, next) => {
	const { idPost } = req.params;
	try {
		const usuarioLogeado = { id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil };

		const post = await Post.findById(idPost).select("_id favs numFavs outlierFavs");
		if (!post) return res.status(404).json({ estado: "error" });

		const postConEsFav = await comprobarFavs([post], usuarioLogeado.id);
		if (postConEsFav[0].esFavorito) return res.status(409).json({ estado: "error" });

		if (!post.outlierFavs) {
			post.favs.push(usuarioLogeado);
		} else {
			const postOutlier = await Fav.find({ idPost: idPost }).sort("-doc").limit(1);
			if (postOutlier.length === 0 || postOutlier[0].favs.length >= LIMITE_ELEMENTOS) {
				const nuevoFav = {
					idPost: idPost,
					doc: (postOutlier[0]?.doc ?? 0) + 1,
					favs: [usuarioLogeado],
				};

				const nuevoPostOutlier = new Fav(nuevoFav);
				await nuevoPostOutlier.save();
			} else {
				postOutlier.favs.push(usuarioLogeado);
				await postOutlier.save();
			}
		}
		post.numFavs++;
		await post.save();

		res.status(200).json({ estado: "ok" });
	} catch (error) {
		next(error);
	}
};

const desfavoritearPost = async (req, res, next) => {
	const { idPost } = req.params;
	try {
		const post = await Post.findById(idPost).select("_id favs numFavs outlierFavs");
		if (!post) return res.status(404).json({ estado: "error" });

		let indexUsuarioLogeado = post.favs.findIndex((fav) => fav.nombre === req.session.usuario);
		if (indexUsuarioLogeado !== -1) {
			post.favs.pull({ nombre: req.session.usuario });
		} else {
			const postOutlier = await Fav.findOneAndUpdate(
				{ idPost: idPost, "favs.nombre": req.session.usuario },
				{
					$pull: {
						favs: {
							nombre: req.session.usuario,
						},
					},
				}
			);

			if (!postOutlier) return res.status(409).json({ estado: "error" });
		}
		post.numFavs--;
		await post.save();

		res.status(200).json({ estado: "ok" });
	} catch (error) {
		next(error);
	}
};

const obtenerPostsTimeline = async (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("_id seguidos outlierSeguidos tls");

			if (!usuario) {
				return res.status(404).end();
			}

			let posts = [];
			const { fecha, dato, ordenTl, timeline } = req.body;

			if (timeline === "Timeline") {
				posts = await usuario.obtenerPostsTimeline(fecha);
			} else {
				const tl = await User.findById(req.session.idUsuario).select({
					_id: 0,
					tls: { $elemMatch: { nombre: timeline } },
				});

				const filtro = construirFiltroTl(tl.tls[0]);

				const filtroSeguidores = {};

				switch (ordenTl) {
					case "-fecha":
						filtro.fecha.$lt = new Date(fecha);
						break;
					case "fecha":
						filtro.fecha.$gt = new Date(fecha);
						break;
					case "-numFavs":
					case "numFavs":
						filtro.numFavs = parseInt(dato);
						break;
					case "-numSeguidores":
					case "numSeguidores":
						filtroSeguidores["datosAutor.numSeguidores"] = parseInt(dato);
				}

				let orden = tl.tls[0].config.orden;
				if (orden !== "fecha" && orden !== "-fecha") orden += " -fecha";

				if (filtro.$or.length !== 0) {
					if (tl.tls[0].config.orden === "numSeguidores" || tl.tls[0].config.orden === "-numSeguidores") {
						posts = await obtenerMasPostsPorNumSeguidores(filtro, fecha, filtroSeguidores, orden, dato);
					} else if (tl.tls[0].config.orden === "numFavs" || tl.tls[0].config.orden === "-numFavs") {
						posts = await obtenerMasPostsPorNumFavs(filtro, fecha, orden, dato);
					} else {
						posts = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden).limit(10);
					}
				}
			}

			const postsConSignedUrls = anyadirSignedUrlsPosts(posts.slice(0, 10), req);

			const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req.session.idUsuario);

			res.status(200).json(postsConFavsYUrls);
		} catch (error) {
			next(error);
		}
	}
};

const obtenerPostsUsuario = async (req, res, next) => {
	const { usuario } = req.params;
	const { fechaPost } = req.body;

	try {
		const postsUsuario = await Post.find({ "autor.nombre": usuario, fecha: { $lt: fechaPost } })
			.select("_id imagen texto numFavs autor comentarios fecha")
			.sort("-fecha");

		const postsConSignedUrls = anyadirSignedUrlsPosts(postsUsuario, req);
		const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req.session.idUsuario);

		res.status(200).json(postsConFavsYUrls);
	} catch (error) {
		next(error);
	}
};

module.exports = { crearPost, obtenerPostsPorTag, favoritearPost, desfavoritearPost, obtenerPostsTimeline, obtenerPostsUsuario };
