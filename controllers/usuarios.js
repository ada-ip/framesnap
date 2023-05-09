const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const Follower = require("../models/Follower");
const Follow = require("../models/Follow");
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada } = require("../utils/aws");
const { comprobarFavs } = require("../utils/consultas");
const {
	sumarNumPosts,
	eliminarDuplicados,
	anyadirSeguidor,
	anyadirSeguido,
	quitarSeguidor,
	quitarSeguido,
	esSeguidor,
	buscarUsuariosPorNombre,
} = require("../utils/consultas");

const registrarUsuario = async (req, res, next) => {
	try {
		const usuario = {
			nombre: req.body.nombre,
			correo: req.body.correo,
			contrasenya: req.body.passw1,
			fotoPerfil: await subirImagenPredeterminada(req.body.nombre.toLowerCase().trim()),
			tls: [
				{
					nombre: "Timeline",
					config: {
						filtro: {
							autor: [],
							tags: [],
							fecha: {},
						},
						orden: "-fecha",
					},
				},
			],
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
		const datosUsuario = await User.findOne({ nombre: usuario }).select(
			"_id nombre fotoPerfil tls numSeguidos numSeguidores"
		);

		let usuarioConSignedUrl = [];
		if (datosUsuario) {
			const usuarioConEsSeguidor = await esSeguidor([datosUsuario], req);
			usuarioConSignedUrl = anyadirSignedUrlsUsuario(usuarioConEsSeguidor, req);
		}
		const postsUsuario = await Post.find({ "autor.nombre": usuario })
			.select("_id imagen texto numFavs autor comentarios fecha")
			.sort("-fecha")
			.limit(10);

		const postsConSignedUrls = anyadirSignedUrlsPosts(postsUsuario, req);
		const postsConFavsYUrls = await comprobarFavs(postsConSignedUrls, req.session.idUsuario);

		let timelines = await User.countDocuments({ "tls.config.filtro.autor": datosUsuario._id });
		timelines += datosUsuario.numSeguidores;

		const usuarioLogeado = anyadirSignedUrlsUsuario(
			[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
			req
		);

		res.render("perfil", {
			usuario: usuarioConSignedUrl[0],
			postsUsuario: postsConFavsYUrls,
			tlsUsuario: timelines,
			usuarioLogeado: { ...usuarioLogeado[0] },
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
			$and: [{ nombre: usuario }, { nombre: { $ne: req.session.usuario } }],
		}).select("-_id nombre");

		if (usuarioEncontrado !== null) {
			usuarios.push(usuarioEncontrado);
		}

		const regex = new RegExp(`^${usuario}`, "i");

		if (req.session.idUsuario) {
			const usuariosSeguidos = await User.aggregate()
				.unwind("$seguidos")
				.match({ nombre: req.session.usuario, "seguidos.nombre": regex })
				.project({ _id: 0, nombre: "$seguidos.nombre" })
				.limit(5);

			usuarios.push(...usuariosSeguidos);

			const usuariosSeguidosOutlier = await Follow.aggregate()
				.unwind("$seguidos")
				.match({ "usuario.nombre": req.session.usuario, "seguidos.nombre": regex })
				.project({ _id: 0, nombre: "$seguidos.nombre" })
				.limit(5);

			usuarios.push(...usuariosSeguidosOutlier);
		}

		const otrosUsuarios = await User.find({ $and: [{ nombre: regex }, { nombre: { $ne: req.session.usuario } }] })
			.select("-_id nombre numSeguidores")
			.sort("-numSeguidores")
			.limit(5);

		usuarios.push(...otrosUsuarios);

		res.status(200).json(eliminarDuplicados(usuarios));
	} catch (error) {
		next(error);
	}
};

const obtenerUsuarios = async (req, res, next) => {
	const usuario = req.query.q;
	const skip = req.query.skip ? parseInt(req.query.skip) : 0;
	try {
		const usuarios = [];

		if (skip === 0) {
			const usuarioEncontrado = await User.findOne({
				$and: [{ nombre: usuario }, { nombre: { $ne: req.session.usuario } }],
			}).select("_id nombre fotoPerfil numSeguidos numSeguidores");

			if (usuarioEncontrado) {
				const postsUsuarioEncontrado = await Post.countDocuments({
					$and: [{ "autor.nombre": usuario }, { "autor.nombre": { $ne: req.session.usuario } }],
				});
				const usuarioConSignedUrl = anyadirSignedUrlsUsuario(
					[{ ...usuarioEncontrado.toObject(), numPosts: postsUsuarioEncontrado }],
					req
				);
				usuarios.push(usuarioConSignedUrl[0]);
			}
		}

		const otrosUsuarios = await buscarUsuariosPorNombre(usuario, req, skip);
		usuarios.push(...otrosUsuarios);

		const usuariosConEsSeguidor = await esSeguidor(usuarios, req);

		if (skip === 0) {
			const usuarioLogeado = anyadirSignedUrlsUsuario(
				[{ _id: req.session.idUsuario, nombre: req.session.usuario, fotoPerfil: req.session.fotoPerfil }],
				req
			);

			res.render("busquedaUsuarios", {
				usuarios: eliminarDuplicados(usuariosConEsSeguidor),
				usuarioLogeado: usuarioLogeado[0],
			});
		} else {
			res.status(200).json({ usuarios: eliminarDuplicados(usuariosConEsSeguidor) });
		}
	} catch (error) {
		next(error);
	}
};

const seguirUsuario = async (req, res, next) => {
	const { usuario } = req.params;

	const sesion = await mongoose.startSession();
	sesion.startTransaction();

	try {
		const usuarioASeguir = await User.findOne({ nombre: usuario }, null, { session: sesion }).select(
			"_id nombre fotoPerfil seguidores numSeguidores outlierSeguidores"
		);
		const usuarioLogeado = await User.findOne({ nombre: req.session.usuario }, null, { session: sesion }).select(
			"_id nombre fotoPerfil seguidos numSeguidos outlierSeguidos"
		);

		if (!usuarioASeguir || !usuarioLogeado) {
			throw new Error("El usuario no existe");
		}

		await anyadirSeguidor(usuarioASeguir, usuarioLogeado, sesion);
		await anyadirSeguido(usuarioASeguir, usuarioLogeado, sesion);

		await sesion.commitTransaction();

		res.status(200).json({ estado: "ok" });
	} catch (error) {
		await sesion.abortTransaction();
		next(error);
	} finally {
		sesion.endSession();
	}
};

const dejarSeguirUsuario = async (req, res, next) => {
	const { usuario } = req.params;

	const sesion = await mongoose.startSession();
	sesion.startTransaction();

	try {
		const usuarioADejarDeSeguir = await User.findOne({ nombre: usuario }, null, { session: sesion }).select(
			"_id nombre seguidores numSeguidores"
		);
		const usuarioLogeado = await User.findOne({ nombre: req.session.usuario }, null, { session: sesion }).select(
			"_id nombre seguidos numSeguidos"
		);

		if (!usuarioADejarDeSeguir || !usuarioLogeado) {
			throw new Error("El usuario no existe");
		}

		await quitarSeguidor(usuarioADejarDeSeguir, usuarioLogeado, sesion);
		await quitarSeguido(usuarioADejarDeSeguir, usuarioLogeado, sesion);

		await sesion.commitTransaction();

		res.status(200).json({ estado: "ok" });
	} catch (error) {
		await sesion.abortTransaction();
		next(error);
	} finally {
		sesion.endSession();
	}
};

const obtenerNombresTls = async (req, res, next) => {
	const { nombreTL } = req.params;
	try {
		const tl = await User.findOne({ _id: req.session.idUsuario, "tls.nombre": nombreTL }).select("_id");

		if (tl) {
			res.status(200).json({ esRepetido: true });
		} else {
			res.status(200).json({ esRepetido: false });
		}
	} catch (error) {
		next(error);
	}
};

const confirmarFotoPerfil = async (req, res, next) => {
	try {
		res.redirect(`/usuarios/${req.session.usuario}`);
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
	obtenerUsuarios,
	seguirUsuario,
	dejarSeguirUsuario,
	obtenerNombresTls,
	confirmarFotoPerfil,
};
