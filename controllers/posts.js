const Post = require("../models/Post");
const Fav = require("../models/Fav");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario } = require("../utils/aws");
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
				fotoPerfil: req.session.fotoPerfil
			},
			favs: [],
			comentarios: [],
			tags: tags
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

const obtenerPosts = async (req, res, next) => {
	const tag = req.query.q;

	try {
		const posts = await Post.find({ tags: tag, fecha: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } })
			.select("_id imagen texto autor numFavs comentarios fecha")
			.sort("-numFavs -fecha");

		const postsConSignedUrl = anyadirSignedUrlsPosts(posts, req);

		const usuarioLogeado = anyadirSignedUrlsUsuario(
			[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
			req
		);

		res.render("busquedaPosts", { posts: postsConSignedUrl, usuarioLogeado: usuarioLogeado[0] });
	} catch (error) {
		next(error);
	}
};

const favoritearPost = async (req, res, next) => {
	const { idPost } = req.params;
	try {
		const post = await Post.findById(idPost).select("_id favs numFavs outlierFavs");
		const usuarioLogeado = { id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil };

		if (!post) throw new Error("No existe ningún post con ese ID");

		if (!post.outlierFavs) {
			post.favs.push(usuarioLogeado);
		} else {
			const postOutlier = await Fav.find({ idPost: idPost }).sort("-doc").limit(1);
			if (postOutlier.length === 0 || postOutlier[0].favs.length >= LIMITE_ELEMENTOS) {
				const nuevoFav = {
					idPost: idPost,
					doc: (postOutlier[0]?.doc ?? 0) + 1,
					favs: [usuarioLogeado]
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

		if (!post) throw new Error("No existe ningún post con ese ID");

		let indexUsuarioLogeado = post.favs.findIndex((fav) => fav.nombre === req.session.usuario);
		if (indexUsuarioLogeado !== -1) {
			post.favs.pull({ nombre: req.session.usuario });
		} else {
			const postOutlier = await Fav.findOneAndUpdate(
				{ idPost: idPost, "favs.nombre": req.session.usuario },
				{
					$pull: {
						favs: {
							nombre: req.session.usuario
						}
					}
				}
			);

			if (!postOutlier) throw new Error("El usuario no ha favoriteado el post");
		}
		post.numFavs--;
		await post.save();

		res.status(200).json({ estado: "ok" });
	} catch (error) {
		next(error);
	}
};

module.exports = { crearPost, obtenerPosts, favoritearPost, desfavoritearPost };
