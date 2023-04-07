const User = require("../models/User");
const Post = require("../models/Post");
const anyadirSignedUrls = require("../utils/aws");

const registrarUsuario = async (req, res, next) => {
	const usuario = {
		nombre: req.body.nombre,
		correo: req.body.correo,
		contrasenya: req.body.passw1,
		tls: [
			{
				nombre: "Timeline",
				config: {
					filtro: {
						autor: [],
						tags: [],
						fecha: {}
					},
					orden: ["-fecha"]
				}
			}
		]
	};
	try {
		const nuevoUsuario = new User(usuario);
		await nuevoUsuario.save();
		res.redirect("/iniciar-sesion");
	} catch (error) {
		next(error);
	}
};

const comprobarUsuarioExiste = async (req, res, next) => {
	const { usuario } = req.params;
	const query = {};
	if (/@/.test(usuario)) {
		query.correo = usuario;
	} else {
		query.nombre = usuario;
	}
	try {
		const usuarioRegistrado = await User.findOne(query).select("nombre correo -_id");
		res.json(usuarioRegistrado);
	} catch (error) {
		next(error);
	}
};

const devolverPerfilUsuario = async (req, res, next) => {
	const { usuario } = req.params;
	try {
		const postsUsuario = await Post.find({})
			.populate({
				path: "autor",
				match: { nombre: usuario },
				select: "_id nombre fotoPerfil seguidos seguidores"
			})
			.select("_id imagen texto autor favs comentarios fecha");

		const signedUrlsPosts = anyadirSignedUrls(postsUsuario, req);

		const timelines = await User.aggregate()
			.unwind("$tls")
			.match({ "tls.config.filtro.autor": usuario })
			.group({
				_id: "$tls.config.filtro.autor",
				count: { $sum: 1 }
			});

		res.render("perfil", { postsUsuario: signedUrlsPosts, tlsUsuario: timelines, usuarioLogeado: req.session.idUsuario });
	} catch (error) {
		next(error);
	}
};

const desconectarUsuario = (req, res, next) => {
	const { usuario } = req.params;
	try {
		if (req.session.idUsuario === usuario) {
			req.session.destroy((err) => {
				if (err) {
					throw new Error("No se pudo destruir la sesión");
				}
				res.redirect("/iniciar-sesion");
			});
		}
	} catch (error) {
		next(error);
	}
};

module.exports = {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario
};
