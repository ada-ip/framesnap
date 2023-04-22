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

			let posts = [];

			if (!req.query.timeline) {
				posts = await usuario.obtenerPostsTimeline();
			} else {
				const tl = await User.findOne({ _id: req.session.idUsuario }).select({
					_id: 0,
					tls: { $elemMatch: { nombre: req.query.timeline } }
				});

				const filtro = {
					$or: []
				};
				if (tl.tls[0].config.filtro.autor.length > 0) {
					filtroAutor = {
						"autor.id": {
							$in: []
						}
					};
					for (let autor of tl.tls[0].config.filtro.autor) {
						filtroAutor["autor.id"].$in.push(autor);
					}
					filtro.$or.push(filtroAutor);
				}
				if (tl.tls[0].config.filtro.tags.length > 0) {
					filtroTags = {
						tags: {
							$in: []
						}
					};
					for (let tag of tl.tls[0].config.filtro.tags) {
						filtroTags.tags.$in.push(tag);
					}
					filtro.$or.push(filtroTags);
				}
				if (typeof tl.tls[0].config.filtro.fecha.$gte === "number") {
					filtro.fecha = {
						$gte: new Date(Date.now() - tl.tls[0].config.filtro.fecha.$gte).toISOString()
					};
				} else {
					filtro.fecha = tl.tls[0].config.filtro.fecha;
				}

				let orden = tl.tls[0].config.orden;

				if (filtro.$or.length !== 0) {
					posts = await Post.find(filtro)
						.populate({ path: "autor.id", select: "numSeguidores" })
						.select("-favs -outlierComentarios -tags")
						.sort("-fecha")
						.sort(orden)
						.limit(15);

					if (orden !== "fecha" && orden !== "-fecha") {
						posts.sort((post1, post2) => {
							if (post1.autor.id.numSeguidores === post2.autor.id.numSeguidores) {
								return post2.fecha - post1.fecha;
							}
							return -1;
						});
					}
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
