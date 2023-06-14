/**
 * Este módulo proporciona controladores para gestionar las cuentas de usuario de los usuarios de la aplicación, y permitir
 * a los usuarios realizar acciones como crearse una cuenta en la aplicación, acceder al perfil de otro usuario, o
 * seguir a un usuario determinado.
 *
 * Los modelos Post, User y Follow son necesarios para manipular los datos correspondientes de la base de datos.
 *
 * Controladores:
 * - registrarUsuario: Crea un nuevo usuario de la aplicación.
 * - comprobarUsuarioExiste: Comprueba si ya existe un usuario registrado con un nombre o un correo determinado.
 * - devolverPerfilUsuario: Renderiza el perfil personal de un usuario determinado.
 * - desconectarUsuario: Finaliza la sesión del usuario conectado.
 * - obtenerNombresUsuarios: Devuelve los nombres de los usuarios cuyo nombre coincide con o comienza por un conjunto de
 * 							 caracteres determinado.
 * - obtenerUsuarios: Devuelve un conjunto de usuarios cuyo nombre coincide con o comienza por un conjunto de caracteres determinado.
 * 					  En el caso de que se haya accedido al controlador con una petición GET, renderiza la página de búsqueda de usuarios
 * 					  con los usuarios encontrados. En el caso de que se haya accedido al controlador con una petición POST, devuelve los
 * 					  usuarios siguientes a los usuarios ya mostrados en la páginade búsqueda de usuarios como objetos JSON.
 * - seguirUsuario: Añade a un usuario determinado a la lista de usuarios seguidos del usuario conectado, y al usuario conectado a la lista
 * 					de seguidores del usuario determinado.
 * - dejarSeguirUsuario: Elimina a un usuario determinado de la lista de usuarios seguidos del usuario conectado, y al usuario conectado de
 * 					     la lista de seguidores del usuario determinado.
 * - confirmarFotoPerfil: Redirige a la página de perfil del usuario conectado si se ha podido subir en el middleware la nueva imagen de
 * 						  perfil sin ningún problema.
 */

// Se importa mongoose para poder hacer uso de las transacciones
const mongoose = require("mongoose");

// Se importan los modelos necesarios
const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

// Se importan todas las funciones necesarias para procesar los datos
const { anyadirSignedUrlsPosts, anyadirSignedUrlsUsuario, subirImagenPredeterminada } = require("../utils/aws");
const { comprobarFavs } = require("../utils/consultas");
const {
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
		res.status(200).json(usuarioRegistrado);
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

		if (!datosUsuario) return res.status(404).render("errores/404");

		const usuarioConEsSeguidor = await esSeguidor([datosUsuario], req.session.idUsuario);
		const usuarioConSignedUrl = anyadirSignedUrlsUsuario(usuarioConEsSeguidor, req);

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
		} else {
			throw new Error("No se puede cerrar la sesión de otro usuario");
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

		const usuariosConEsSeguidor = await esSeguidor(usuarios, req.session.idUsuario);

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
			res.status(200).json(eliminarDuplicados(usuariosConEsSeguidor));
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

const confirmarFotoPerfil = (req, res, next) => {
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
	confirmarFotoPerfil,
};
