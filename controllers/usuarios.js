const User = require("../models/User");
const Post = require("../models/Post");
const Follower = require("../models/Follower");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada } = require("../utils/aws");
const { sumarSeguidoresOutliers } = require("../utils/outliers");

const registrarUsuario = async (req, res, next) => {
	try {
		const usuario = {
			nombre: req.body.nombre,
			correo: req.body.correo,
			contrasenya: req.body.passw1,
			fotoPerfil: await subirImagenPredeterminada(req.body.nombre),
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

		const usuarioConSignedUrl = anyadirSignedUrlsUsuario(datosUsuario, req);

		const postsUsuario = await Post.find({ "autor.nombre": usuario })
			.select("_id imagen texto favs autor comentarios fecha")
			.sort("-fecha");

		const postsConSignedUrls = anyadirSignedUrlsPosts(postsUsuario, req);

		const timelines = await User.countDocuments({ "tls.config.filtro.autor.nombre": usuario });

		res.render("perfil", {
			usuario: usuarioConSignedUrl,
			postsUsuario: postsConSignedUrls,
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

		const filtroUsuarios = [{ nombre: usuario }];
		if (req.session.usuario) {
			filtroUsuarios.push({ nombre: { $ne: req.session.usuario } });
		}

		const usuarioEncontrado = await User.findOne({ $and: filtroUsuarios }).select("-_id nombre");
		if (usuarioEncontrado !== null) {
			usuarios.push(usuarioEncontrado);
		}

		const regex = new RegExp(`^${usuario}`, "i");

		if (req.session.idUsuario) {
			const usuariosSeguidos = await User.find({ "seguidos.nombre": regex }).select("-_id nombre").limit(10);
			usuarios.push(...usuariosSeguidos);
		}

		filtroUsuarios[0].nombre = regex;
		const otrosUsuarios = await User.aggregate()
			.match({ $and: filtroUsuarios })
			.group({ _id: "$nombre", numSeguidores: { $sum: { $size: "$seguidores" } } })
			.project({ _id: 0, nombre: "$_id", numSeguidores: 1 });

		filtroUsuarios.forEach((filtro) => {
			filtro["usuario.nombre"] = filtro.nombre;
			delete filtro.nombre;
		});
		const usuariosOutliers = await Follower.aggregate()
			.match({ $and: filtroUsuarios })
			.group({ _id: "$usuario.nombre", numSeguidores: { $sum: { $size: "$seguidores" } } })
			.project({ _id: 0, nombre: "$_id", numSeguidores: 1 });

		const otrosUsuariosTotales = sumarSeguidoresOutliers([...otrosUsuarios, ...usuariosOutliers])
			.sort((us1, us2) => us2.numSeguidores - us1.numSeguidores)
			.slice(0, 10);

		usuarios.push(...otrosUsuariosTotales);

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
