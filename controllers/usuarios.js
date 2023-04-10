const User = require("../models/User");
const Post = require("../models/Post");
const Follower = require("../models/Follower");
const Follow = require("../models/Follow");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada } = require("../utils/aws");
const { sumarSeguidoresOutliers, sumarSeguidosOutliers, sumarSeguidoresYSeguidos } = require("../utils/outliers");
const { sumarNumPosts, eliminarDuplicados } = require("../utils/metodosConsultas");
const LIMITE_ELEMENTOS = 1000;

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
		const datosUsuario = await User.aggregate()
			.match({ nombre: usuario })
			.project({
				_id: 1,
				nombre: 1,
				fotoPerfil: 1,
				tls: 1,
				numSeguidos: { $size: "$seguidos" },
				numSeguidores: { $size: "$seguidores" },
				outlierSeguidos: 1,
				outlierSeguidores: 1
			});

		const datosUsuarioTotales = await sumarSeguidoresYSeguidos(datosUsuario);

		let usuarioConSignedUrl = [];
		if (datosUsuarioTotales.length > 0) {
			console.log(datosUsuarioTotales);
			usuarioConSignedUrl = anyadirSignedUrlsUsuario(datosUsuarioTotales, req);
		}
		const postsUsuario = await Post.find({ "autor.nombre": usuario })
			.select("_id imagen texto favs autor comentarios fecha")
			.sort("-fecha");

		const postsConSignedUrls = anyadirSignedUrlsPosts(postsUsuario, req);

		const timelines = await User.countDocuments({ "tls.config.filtro.autor": usuarioConSignedUrl[0]._id });

		const usuarioLogeado = anyadirSignedUrlsUsuario(
			[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
			req
		);

		const esSeguidor = await User.findOne({ nombre: usuario, "seguidores.id": req.session.idUsuario });
		const esSeguidorOutlier = await Follower.findOne({ "usuario.nombre": usuario, "seguidores.id": req.session.idUsuario });

		res.render("perfil", {
			usuario: usuarioConSignedUrl[0],
			postsUsuario: postsConSignedUrls,
			tlsUsuario: timelines,
			usuarioLogeado: { ...usuarioLogeado[0], esSeguidor: esSeguidor !== null || esSeguidorOutlier !== null ? true : false }
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

		const usuarioEncontrado = await User.findOne({
			$and: [{ nombre: usuario }, { nombre: { $ne: req.session.usuario } }]
		}).select("-_id nombre");

		if (usuarioEncontrado !== null) {
			usuarios.push(usuarioEncontrado);
		}

		const regex = new RegExp(`^${usuario}`, "i");

		if (req.session.idUsuario) {
			const usuariosSeguidos = await User.find({ "seguidos.nombre": regex }).select("-_id nombre").limit(10);
			usuarios.push(...usuariosSeguidos);
		}

		const otrosUsuarios = await User.aggregate()
			.match({ $and: [{ nombre: regex }, { nombre: { $ne: req.session.usuario } }] })
			.project({ _id: 0, nombre: 1, numSeguidores: { $size: "$seguidores" }, outlierSeguidores: 1 });

		if (otrosUsuarios.some((usuario) => usuario.outlierSeguidores)) {
			const usuariosOutliers = await Follower.aggregate()
				.match({ $and: [{ "usuario.nombre": regex }, { "usuario.nombre": { $ne: req.session.usuario } }] })
				.project({ _id: 0, nombre: "$usuario.nombre", numSeguidores: { $size: "$seguidores" } });

			const otrosUsuariosTotales = sumarSeguidoresOutliers([...otrosUsuarios, ...usuariosOutliers])
				.sort((us1, us2) => us2.numSeguidores - us1.numSeguidores)
				.slice(0, 10);
			usuarios.push(...otrosUsuariosTotales);
		} else {
			usuarios.push(...otrosUsuarios.sort((us1, us2) => us2.numSeguidores - us1.numSeguidores).slice(0, 10));
		}

		res.status(200).json(eliminarDuplicados(usuarios));
	} catch (error) {
		next(error);
	}
};

const obtenerUsuarios = async (req, res, next) => {
	const { usuario } = req.query;
	try {
		const usuarios = [];

		const usuarioEncontrado = await User.aggregate()
			.match({ $and: [{ nombre: usuario }, { nombre: { $ne: req.session.usuario } }] })
			.project({
				_id: 1,
				nombre: 1,
				fotoPerfil: 1,
				numSeguidos: { $size: "$seguidos" },
				numSeguidores: { $size: "$seguidores" },
				outlierSeguidos: 1,
				outlierSeguidores: 1
			});

		const datosUsuarioTotales = await sumarSeguidoresYSeguidos(usuarioEncontrado);

		if (datosUsuarioTotales.length > 0) {
			const postsUsuarioEncontrado = await Post.countDocuments({
				$and: [{ "autor.nombre": usuario }, { "autor.nombre": { $ne: req.session.usuario } }]
			});
			const usuarioConSignedUrl = anyadirSignedUrlsUsuario(
				[{ ...datosUsuarioTotales[0], numPosts: postsUsuarioEncontrado }],
				req
			);
			usuarios.push(usuarioConSignedUrl[0]);
		}

		const regex = new RegExp(`^${usuario}`, "i");

		const postsUsuarios = await Post.aggregate()
			.match({ $and: [{ "autor.nombre": regex }, { "autor.nombre": { $ne: req.session.usuario } }] })
			.group({ _id: "$autor.nombre", numPosts: { $sum: 1 } })
			.project({
				_id: 0,
				nombre: "$_id",
				numPosts: 1
			});

		if (req.session.idUsuario) {
			const usuariosSeguidos = await User.aggregate()
				.match({ "seguidos.nombre": regex })
				.lookup({
					from: "users",
					localField: "seguidos.id",
					foreignField: "_id",
					as: "datosSeguidos"
				})
				.project({
					_id: "$datosSeguidos._id",
					nombre: "$datosSeguidos.nombre",
					fotoPerfil: "$datosSeguidos.fotoPerfil",
					numSeguidos: { $size: "$datosSeguidos.seguidos" },
					numSeguidores: { $size: "$datosSeguidos.seguidores" },
					outlierSeguidos: "$datosSeguidos.outlierSeguidos",
					outlierSeguidores: "$datosSeguidos.outlierSeguidores"
				});

			const usuariosSeguidosTotales = await sumarSeguidoresYSeguidos(usuariosSeguidos);

			if (usuariosSeguidosTotales.length > 0) {
				const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(usuariosSeguidosTotales, postsUsuarios), req);
				usuarios.push(...usuariosConSignedUrl);
			} else {
				usuarios.push(...usuariosSeguidosTotales);
			}
		}

		const otrosUsuarios = await User.aggregate()
			.match({ $and: [{ nombre: regex }, { nombre: { $ne: req.session.usuario } }] })
			.project({
				_id: 0,
				nombre: 1,
				fotoPerfil: 1,
				numSeguidos: { $size: "$seguidos" },
				numSeguidores: { $size: "$seguidores" },
				outlierSeguidos: 1,
				outlierSeguidores: 1
			});

		const otrosUsuariosTotales = await sumarSeguidoresYSeguidos(otrosUsuarios);

		if (otrosUsuariosTotales.length > 0) {
			const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(otrosUsuariosTotales, postsUsuarios), req);
			usuarios.push(...usuariosConSignedUrl);
		} else {
			usuarios.push(...otrosUsuariosTotales);
		}

		const usuarioLogeado = anyadirSignedUrlsUsuario(
			[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
			req
		);

		res.render("busquedaUsuarios", { usuarios: eliminarDuplicados(usuarios), usuarioLogeado: usuarioLogeado[0] });
	} catch (error) {
		next(error);
	}
};

module.exports = {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario,
	obtenerNombresUsuarios,
	obtenerUsuarios
};
