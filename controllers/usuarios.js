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
		const datosUsuario = await User.findOne({ nombre: usuario }).select("_id nombre fotoPerfil seguidos seguidores");

		const postsUsuario = await Post.find({})
			.populate({
				path: "autor",
				match: { nombre: usuario }
			})
			.select("_id imagen texto favs comentarios fecha")
			.sort("-fecha");

		const signedUrlsPosts = anyadirSignedUrls(postsUsuario, req);

		const timelines = await User.aggregate()
			.unwind("$tls")
			.unwind("$tls.config.filtro.autor")
			.lookup({
				from: "users",
				localField: "tls.config.filtro.autor",
				foreignField: "_id",
				as: "tls.config.filtro.datosAutor"
			})
			.match({ "tls.config.filtro.datosAutor.nombre": usuario })
			.group({
				_id: "$tls.config.filtro.datosAutor.nombre",
				count: { $sum: 1 }
			});

		res.render("perfil", {
			usuario: datosUsuario,
			postsUsuario: signedUrlsPosts,
			tlsUsuario: timelines,
			usuarioLogeado: req.session.idUsuario
		});
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

const obtenerNombresUsuarios = async (req, res, next) => {
	const { usuario } = req.params;
	try {
		const usuarios = [];

		const usuarioEncontrado = await User.findOne({ nombre: usuario }).select("-_id nombre");
		if (usuarioEncontrado !== null) {
			usuarios.push(usuarioEncontrado);
		}

		const regex = new RegExp(`^${usuario}`, "i");

		if (req.session.idUsuario) {
			const usuariosSeguidos = await User.aggregate()
				.match({ _id: req.session.idUsuario })
				.unwind("$seguidos")
				.lookup({
					from: "users",
					localField: "seguidos",
					foreignField: "_id",
					as: "usuariosSeguidos"
				})
				.match({ "usuariosSeguidos.nombre": regex })
				.project({
					_id: 0,
					"usuariosSeguidos.nombre": 1
				})
				.limit(10);
			usuarios.push(...usuariosSeguidos);
		}

		const otrosUsuarios = await User.aggregate()
			.match({ nombre: regex })
			.unwind({ path: "$seguidores", preserveNullAndEmptyArrays: true })
			.group({ _id: "$nombre", count: { $sum: 1 } })
			.sort({ count: -1 })
			.project({ _id: 0, nombre: "$_id" })
			.limit(10);
		usuarios.push(...otrosUsuarios);

		res.status(200).json(usuarios);
	} catch (error) {
		next(error);
	}
};

module.exports = {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario,
	obtenerNombresUsuarios
};
