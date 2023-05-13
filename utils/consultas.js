/**
 * Funciones auxiliares para realizar consultas a la base de datos o para procesar el resultado de las consultas a la base de datos.
 *
 * Este módulo contiene funciones auxiliares para poder gestionar los usuarios/posts que tengan información almacenada
 * en las colecciones auxiliares además de en las colecciones principales, como por ejemplo, funciones para seguir/dejar de seguir
 * a un usuario que puede o no tener muchos seguidores, o una función para comprobar si un usuario ha favoriteado un post.
 * También contiene funciones auxiliares para la realización de consultas como, por ejemplo, funciones para crear los filtros
 * necesarios por los que consultar.
 *
 * Funciones:
 * - sumarNumPosts: Añade a un conjunto de objetos usuario el número de posts que ha creado cada usuario en la aplicación.
 * - eliminarDuplicados: Elimina los usuarios repetidos de un conjunto de usuarios.
 * - anyadirSeguidor: Añade un nuevo seguidor a un usuario determinado.
 * - anyadirSeguido: Añade un nuevo usuario seguido a un usuario determinado.
 * - quitarSeguidor: Quita a un usuario determinado de la lista de usuarios seguidos del usuario conectado a la aplicación.
 */

// Se importan los módulos y los modelos de Mongoose necesarios para las funciones
const User = require("../models/User");
const Post = require("../models/Post");
const Follower = require("../models/Follower");
const Follow = require("../models/Follow");
const { anyadirSignedUrlsUsuario } = require("./aws");
const LIMITE_ELEMENTOS = 1000; // El límite de elementos que va a contener un campo array de un documento de la base de datos

/**
 * Añade a un conjunto de objetos usuario el número de posts que ha creado cada usuario en la aplicación.
 *
 * @param {Array.<Object>} usuarios		Un array de objetos usuario (resultado de una consulta a la colección users de la base de datos)
 * 										que tiene que tener como mínimo la siguiente propiedad:
 * 										- nombre: El nombre del usuario.
 * @param {Array.<Object>} posts		Un array de objetos post (resultado de una consulta a la colección posts de la base de datos)
 * 										que tiene que tener como mínimo la siguiente propiedad:
 * 										- nombreAutor: El nombre del usuario que ha creado el post.
 * @returns {Array.<Object>}			Los objetos usuario originales con la propiedad de numPosts (número de posts) añadida
 */
const sumarNumPosts = (usuarios, posts) =>
	usuarios.map((usuario) => {
		// Se busca el nombre de cada usuario en el array de posts
		let usuarioEncontrado = posts.find((post) => post.nombreAutor === usuario.nombre);
		// Si se encuentra el usuario se añade el nº de posts que corresponda
		if (usuarioEncontrado) {
			return { ...(usuario.toObject ? usuario.toObject() : usuario), numPosts: usuarioEncontrado.numPosts };
		} else {
			// Si no se encuentra el nº de posts es 0
			return { ...(usuario.toObject ? usuario.toObject() : usuario), numPosts: 0 };
		}
	});

/**
 * Elimina los usuarios repetidos de un conjunto de usuarios.
 *
 * @param {Array.<Object>} usuarios 	Un array de objetos usuario (resultado de una consulta a la colección users de la base de datos)
 * 										que tiene que tener como mínimo la siguiente propiedad:
 * 										- nombre: El nombre del usuario.
 * @returns {Array.<Object>}			Un array de objectos usuario sin usuarios repetidos.
 */
const eliminarDuplicados = (usuarios) =>
	usuarios.reduce((arrayUsuarios, usuario) => {
		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

		// Sólo se añaden al array a devolver, los usuarios no repetidos
		if (!usuarioEncontrado) {
			arrayUsuarios.push(usuario);
		}
		return arrayUsuarios;
	}, []);

/**
 * Añade un nuevo seguidor a un usuario determinado.
 *
 * @param {Object} usuarioASeguir	El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se
 * 									se le quiere añadir un seguidor. Tiene que tener las siguientes propiedades:
 * 									- _id: el id del usuario a seguir.
 * 									- nombre: el nombre del usuario a seguir.
 * 									- fotoPerfil: la url de la foto de perfil del usuario a seguir.
 * 									- seguidores: los seguidores del usuario a seguir.
 * 									- numSeguidores: el nº de seguidores del usuario a seguir.
 * 									- outlierSeguidores: si el usuario tiene seguidores guardados en la colección auxiliar.
 * @param {Object} usuarioLogeado	El usuario (objeto resultado de una consulta a la colección users de la base de datos) que se va
 * 									a añadir como nuevo seguidor (el usuario con sesión abierta). Tiene que tener las siguientes
 * 									propiedades:
 * 									- _id: el id del usuario conectado.
 * 									- nombre: el nombre del usuario conectado.
 * 									- fotoPerfil: la url de la foto de perfil del usuario conectado.
 * @param {ClientSession} sesion	Una sesión de Mongoose que controle una transacción.
 */
const anyadirSeguidor = async (usuarioASeguir, usuarioLogeado, sesion) => {
	/* Si el usuario al que se le va añadir un seguidor no ha llegado al límite de seguidores que se pueden tener en la
	colección principal, se le añade directamente el usuario logeado como nuevo seguidor en dicha colección */
	if (!usuarioASeguir.outlierSeguidores && usuarioASeguir.numSeguidores < LIMITE_ELEMENTOS) {
		usuarioASeguir.seguidores.push({
			id: usuarioLogeado._id,
			nombre: usuarioLogeado.nombre,
			fotoPerfil: usuarioLogeado.fotoPerfil,
		});
		// También se le añade 1 al número de seguidores para poder controlar el nº de seguidores total en la colección principal
		usuarioASeguir.numSeguidores++;
		await usuarioASeguir.save({ session: sesion });
	} else {
		/* Si el usuario ya ha llegado al límite de seguidores en la colección principal, se busca su último documento en la
		colección auxiliar de seguidores */
		const usuarioOutlier = await Follower.find({ nombre: usuarioASeguir.nombre }, null, { session: sesion })
			.sort("-doc")
			.limit(1);

		/* Si no existe dicho documento o el documento ya tiene el límite de seguidores, se crea un nuevo documento
		en la colección auxiliar */
		if (usuarioOutlier.length === 0 || usuarioOutlier[0].seguidores.length === LIMITE_ELEMENTOS) {
			const nuevoUsuarioParams = {
				usuario: { id: usuarioASeguir._id, nombre: usuarioASeguir.nombre, fotoPerfil: usuarioASeguir.fotoPerfil },
				// El nº de documento será el del documento encontrado + 1 si se ha encontrado un documento, o 1 si no existía documento
				doc: (usuarioOutlier[0]?.doc ?? 0) + 1,
				seguidores: [{ id: usuarioLogeado._id, nombre: usuarioLogeado.nombre, fotoPerfil: usuarioLogeado.fotoPerfil }],
			};

			// Se guarda el nuevo documento en la colección auxiliar
			const nuevoUsuarioOutlier = new Follower(nuevoUsuarioParams);
			await nuevoUsuarioOutlier.save({ session: sesion });

			/* Si se ha creado el 1º documento del usuario en la colección auxiliar, se indica en el documento del usuario
			de la colección principal que se están guardando seguidores del usuario en la colección auxiliar */
			if (usuarioOutlier.length === 0) usuarioASeguir.outlierSeguidores = true;
			usuarioASeguir.numSeguidores++;
			await usuarioASeguir.save({ session: sesion });
		} else {
			/* Si el documento de la colección auxiliar no ha llegado al límite de elementos, simplemente se le añade el usuario logeado
			como nuevo seguidor */
			usuarioOutlier[0].seguidores.push({
				id: usuarioLogeado._id,
				nombre: usuarioLogeado.nombre,
				fotoPerfil: usuarioLogeado.fotoPerfil,
			});

			await usuarioOutlier.save({ session: sesion });

			usuarioASeguir.numSeguidores++;
			await usuarioASeguir.save({ session: sesion });
		}
	}
};

/**
 * Añade un nuevo usuario seguido a un usuario determinado.
 *
 * @param {Object} usuarioASeguir 	El usuario (objeto resultado de una consulta a la colección users de la base de datos) que se le va a
 * 									añadir como usuario seguido al usuario conectado.
 * 									- _id: el id del usuario que se va a añadir como usuario seguido.
 * 									- nombre: el nombre del usuario que se va a añadir como usuario seguido.
 * 									- fotoPerfil: la url de la foto de perfil que se va a añadir como usuario seguido.
 * @param {Object} usuarioLogeado 	El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se le va
 * 									a añadir un nuevo usuario seguido.


 * @param {ClientSession} sesion 	Una sesión de Mongoose que controle una transacción.
 */
const anyadirSeguido = async (usuarioASeguir, usuarioLogeado, sesion) => {
	/* Si el usuario conectado al que se le va añadir un usuario seguido no ha llegado al límite de usuarios seguidos que se pueden 
	tener en la colección principal, se le añade directamente el usuario a seguir como nuevo seguido en dicha colección */
	if (!usuarioLogeado.outlierSeguidos && usuarioLogeado.numSeguidos < LIMITE_ELEMENTOS) {
		usuarioLogeado.seguidos.push({
			id: usuarioASeguir._id,
			nombre: usuarioASeguir.nombre,
			fotoPerfil: usuarioASeguir.fotoPerfil,
		});
		// También se le añade 1 al número de seguidos para poder controlar el nº de seguidos total en la colección principal
		usuarioLogeado.numSeguidos++;
		await usuarioLogeado.save({ session: sesion });
	} else {
		/* Si el usuario ya ha llegado al límite de usuarios seguidos en la colección principal, se busca su último documento en la
		colección auxiliar de seguidos */
		const usuarioOutlier = await Follow.find({ nombre: usuarioLogeado.nombre }, null, { session: sesion })
			.sort("-doc")
			.limit(1);

		/* Si no existe dicho documento o el documento ya llega al límite de seguidos, se crea un nuevo documento
		en la colección auxiliar */
		if (usuarioOutlier.length === 0 || usuarioOutlier[0].seguidos.length === LIMITE_ELEMENTOS) {
			const nuevoUsuarioParams = {
				usuario: { id: usuarioLogeado._id, nombre: usuarioLogeado.nombre, fotoPerfil: usuarioLogeado.fotoPerfil },
				// El nº de documento será el del documento encontrado + 1 si se ha encontrado un documento, o 1 si no existía documento
				doc: (usuarioOutlier[0]?.doc ?? 0) + 1,
				seguidos: [{ id: usuarioASeguir._id, nombre: usuarioASeguir.nombre, fotoPerfil: usuarioASeguir.fotoPerfil }],
			};

			// Se guarda el nuevo documento en la colección auxiliar
			const nuevoUsuarioOutlier = new Follow(nuevoUsuarioParams);
			await nuevoUsuarioOutlier.save({ session: sesion });

			/* Si se ha creado el 1º documento del usuario en la colección auxiliar, se indica en el documento del usuario
			de la colección principal que se están guardando los usuarios seguidos en la colección auxiliar */
			if (usuarioOutlier.length === 0) usuarioLogeador.outlierSeguidos = true;
			usuarioLogeado.numSeguidos++;
			await usuarioLogeado.save({ session: sesion });
		} else {
			/* Si el documento de la colección auxiliar no ha llegado al límite de elementos, simplemente se le añade al usuario logeado
			el nuevo usuario seguido */
			usuarioOutlier[0].seguidos.push({
				id: usuarioASeguir._id,
				nombre: usuarioASeguir.nombre,
				fotoPerfil: usuarioASeguir.fotoPerfil,
			});

			await usuarioOutlier.save({ session: sesion });

			usuarioLogeado.numSeguidos++;
			await usuarioLogeado.save({ session: sesion });
		}
	}
};

/**
 * Quita a un usuario determinado de la lista de usuarios seguidos del usuario conectado a la aplicación.
 *
 * @param {Object} usuarioADejarDeSeguir   El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se
 * 										   quiere dejar de seguir.
 * @param {Object} usuarioLogeado		   El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se le va
 * 										   a quitar el usuario seguido.
 * @param {ClientSession} sesion		   Una sesión de Mongoose que controle una transacción.
 */
const quitarSeguidor = async (usuarioADejarDeSeguir, usuarioLogeado, sesion) => {
	let indexUsuarioLogeado = usuarioADejarDeSeguir.seguidores.findIndex((seguidor) => seguidor.nombre === usuarioLogeado.nombre);
	if (indexUsuarioLogeado !== -1) {
		usuarioADejarDeSeguir.seguidores.pull({ id: usuarioLogeado._id });
	} else {
		const usuarioOutlier = await Follower.findOneAndUpdate(
			{ "usuario.id": usuarioADejarDeSeguir._id, "seguidores.id": usuarioLogeado._id },
			{
				$pull: {
					seguidores: {
						id: usuarioLogeado._id,
					},
				},
			},
			{ session: sesion }
		);

		if (!usuarioOutlier) throw new Error("El usuario no se encuentra entre los seguidores");
	}
	usuarioADejarDeSeguir.numSeguidores--;
	await usuarioADejarDeSeguir.save({ session: sesion });
};

const quitarSeguido = async (usuarioADejarDeSeguir, usuarioLogeado, sesion) => {
	let indexUsuarioADejarDeSeguir = usuarioLogeado.seguidos.findIndex(
		(seguido) => seguido.nombre === usuarioADejarDeSeguir.nombre
	);
	if (indexUsuarioADejarDeSeguir !== -1) {
		usuarioLogeado.seguidos.pull({ id: usuarioADejarDeSeguir._id });
	} else {
		const usuarioOutlier = await Follow.findOneAndUpdate(
			{
				"usuario.id": usuarioLogeado._id,
				"seguidos.id": usuarioADejarDeSeguir._id,
			},
			{ $pull: { seguidos: { id: usuarioADejarDeSeguir._id } } },
			{ session: sesion }
		);

		if (!usuarioOutlier) throw new Error("El usuario no se encuentra entre los seguidos");
	}
	usuarioLogeado.numSeguidos--;
	await usuarioLogeado.save({ session: sesion });
};

/**
 * Comprueba si un usuario ha favoriteado o no los posts de un conjunto de posts
 * @param {Array.<Object>} posts	Un array de posts que tienen que tener como mínimo la siguiente propiedad:
 * 									- _id
 * @param {*} req
 * @returns
 */
const comprobarFavs = async (posts, idUsuario) => {
	const resultado = posts.map(async (post) => {
		const esFavorito = await Post.findOne({ _id: post._id, "favs.id": idUsuario });
		let esFavoritoOutlier;
		if (post.outlierFavs && !esFavorito) {
			esFavoritoOutlier = await Fav.findOne({ idPost: post._id, "favs.id": idUsuario });
		}
		if (esFavorito || esFavoritoOutlier) {
			return { ...post, esFavorito: true };
		} else {
			return { ...post, esFavorito: false };
		}
	});

	return await Promise.all(resultado);
};

const formatearFechaTl = (fecha) => {
	const fechaFormateada = {};

	if (typeof fecha.$gte === "number") {
		const tiempo = {
			1: "dia",
			7: "semana",
			30: "mes",
			180: "smes",
		};
		fechaFormateada.opcion = tiempo[`${fecha.$gte / (24 * 60 * 60 * 1000)}`];
	} else {
		fechaFormateada.opcion = "elegir";
		fechaFormateada.$gte = fecha.$gte;
		if (fecha.$lte) fechaFormateada.$lte = fecha.$lte;
	}
	return fechaFormateada;
};

const construirFiltroTl = (tl) => {
	const filtro = {
		$or: [],
	};

	if (tl.config.filtro.autor.length > 0) {
		filtroAutor = {
			"autor.id": {
				$in: [],
			},
		};
		for (let autor of tl.config.filtro.autor) {
			filtroAutor["autor.id"].$in.push(autor);
		}
		filtro.$or.push(filtroAutor);
	}
	if (tl.config.filtro.tags.length > 0) {
		filtroTags = {
			tags: {
				$in: [],
			},
		};
		for (let tag of tl.config.filtro.tags) {
			filtroTags.tags.$in.push(tag);
		}
		filtro.$or.push(filtroTags);
	}
	if (typeof tl.config.filtro.fecha.$gte === "number") {
		filtro.fecha = {
			$gte: new Date(Date.now() - tl.config.filtro.fecha.$gte),
		};
	} else {
		filtro.fecha = {};
		if (tl.config.filtro.fecha.$lte) filtro.fecha.$lte = new Date(tl.config.filtro.fecha.$lte);
		if (tl.config.filtro.fecha.$gte) filtro.fecha.$gte = new Date(tl.config.filtro.fecha.$gte);
	}

	return filtro;
};

const eliminarSugerenciasSeguidos = async (usuarios, usuarioLogeado) => {
	const seguidos = await User.findById(usuarioLogeado).select("-_id seguidos outlierSeguidos");
	const seguidosOutlier = [];
	if (seguidos.outlierSeguidos) {
		const masSeguidos = await Follow.find({ "usuario.id": usuarioLogeado }).select("-_id seguidos");
		masSeguidos.forEach((doc) => seguidosOutlier.push(...doc.seguidos));
	}

	return usuarios.reduce((arrayUsuarios, usuario) => {
		let i = seguidos.seguidos.findIndex((seguido) => seguido.nombre === usuario.nombre);
		let iOutlier = -1;
		if (seguidosOutlier.length > 0) {
			iOutlier = seguidosOutlier.seguidos.findIndex((seguido) => seguido.nombre === usuario.nombre);
		}

		if (i === -1 && iOutlier === -1) arrayUsuarios.push(usuario);

		return arrayUsuarios;
	}, []);
};

const obtenerMasPostsPorNumSeguidores = async (filtro, fechaPost, filtroSeguidores, orden, datoPost) => {
	const posts = await Post.aggregate()
		.match({ ...filtro, fecha: { $lt: new Date(fechaPost) } })
		.lookup({ from: "users", localField: "autor.id", foreignField: "_id", as: "datosAutor" })
		.unwind("$datosAutor")
		.match(filtroSeguidores)
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

	if (posts.length < 10) {
		if (orden.substring(0, orden.indexOf(" ")) === "-numSeguidores")
			filtroSeguidores["datosAutor.numSeguidores"] = { $lt: parseInt(datoPost) };
		else filtroSeguidores["datosAutor.numSeguidores"] = { $gt: parseInt(datoPost) };

		const postsOtrosSeguidores = await Post.aggregate()
			.match(filtro)
			.lookup({ from: "users", localField: "autor.id", foreignField: "_id", as: "datosAutor" })
			.unwind("$datosAutor")
			.match(filtroSeguidores)
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

		posts.push(...postsOtrosSeguidores);
	}

	return posts;
};

const obtenerMasPostsPorNumFavs = async (filtro, fechaPost, orden, datoPost) => {
	const posts = await Post.find({ ...filtro, fecha: { $lt: new Date(fechaPost) } })
		.select("-favs -outlierComentarios -tags")
		.sort(orden)
		.limit(10);

	if (posts.length < 10) {
		if (orden.substring(0, orden.indexOf(" ")) === "-numFavs") filtro.numFavs = { $lt: parseInt(datoPost) };
		else filtro.numFavs = { $gt: parseInt(datoPost) };

		const postsOtrosFavoritos = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden).limit(10);

		posts.push(...postsOtrosFavoritos);
	}
	return posts;
};

const esSeguidor = async (usuarios, req) => {
	const resultado = await Promise.all(
		usuarios.map(async (usuario) => {
			const esSeguidor = await User.findOne({ nombre: usuario.nombre, "seguidores.id": req.session.idUsuario }).select(
				"nombre"
			);
			const esSeguidorOutlier = await Follower.findOne({
				"usuario.nombre": usuario.nombre,
				"seguidores.id": req.session.idUsuario,
			}).select("nombre");

			return {
				...(usuario.toObject ? usuario.toObject() : usuario),
				esSeguidor: esSeguidor || esSeguidorOutlier ? true : false,
			};
		})
	);

	return resultado;
};

const buscarUsuariosPorNombre = async (usuario, req, skip) => {
	const usuarios = [];

	const regex = new RegExp(`^${usuario}`, "i");

	const postsUsuarios = await Post.aggregate()
		.match({ $and: [{ "autor.nombre": regex }, { "autor.nombre": { $ne: req.session.usuario } }] })
		.group({ _id: "$autor.nombre", numPosts: { $sum: 1 } })
		.project({
			_id: 0,
			nombreAutor: "$_id",
			numPosts: 1,
		});

	if (req.session.idUsuario) {
		const usuariosSeguidos = await buscarUsuarioSeguido(req, regex, skip, postsUsuarios);
		usuarios.push(...usuariosSeguidos);
	}

	const otrosUsuarios = await User.find({ $and: [{ nombre: regex }, { nombre: { $ne: req.session.usuario } }] })
		.select("_id nombre fotoPerfil numSeguidos numSeguidores")
		.sort("nombre")
		.skip(skip)
		.limit(15);

	if (otrosUsuarios.length > 0) {
		const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(otrosUsuarios, postsUsuarios), req);
		usuarios.push(...usuariosConSignedUrl);
	}

	return usuarios;
};

const buscarUsuarioSeguido = async (req, regex, skip, postsUsuarios) => {
	const usuarios = [];
	const usuariosSeguidos = await User.aggregate()
		.unwind("$seguidos")
		.match({ nombre: req.session.usuario, "seguidos.nombre": regex })
		.lookup({
			from: "users",
			localField: "seguidos.id",
			foreignField: "_id",
			as: "datosSeguidos",
		})
		.unwind("$datosSeguidos")
		.project({
			_id: "$datosSeguidos._id",
			nombre: "$datosSeguidos.nombre",
			fotoPerfil: "$datosSeguidos.fotoPerfil",
			numSeguidos: "$datosSeguidos.numSeguidos",
			numSeguidores: "$datosSeguidos.numSeguidores",
		})
		.sort("nombre")
		.skip(skip)
		.limit(15);

	if (usuariosSeguidos.length > 0) {
		const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(usuariosSeguidos, postsUsuarios), req);
		usuarios.push(...usuariosConSignedUrl);
	}

	const usuariosSeguidosOutlier = await Follow.aggregate()
		.unwind("$seguidos")
		.match({ "usuario.nombre": req.session.usuario, "seguidos.nombre": regex })
		.lookup({
			from: "users",
			localField: "seguidos.id",
			foreignField: "_id",
			as: "datosSeguidos",
		})
		.unwind("$datosSeguidos")
		.project({
			_id: "$datosSeguidos._id",
			nombre: "$datosSeguidos.nombre",
			fotoPerfil: "$datosSeguidos.fotoPerfil",
			numSeguidos: "$datosSeguidos.numSeguidos",
			numSeguidores: "$datosSeguidos.numSeguidores",
		})
		.sort("nombre")
		.skip(skip)
		.limit(15);

	if (usuariosSeguidosOutlier.length > 0) {
		const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(usuariosSeguidosOutlier, postsUsuarios), req);
		usuarios.push(...usuariosConSignedUrl);
	}
	return usuarios;
};

module.exports = {
	sumarNumPosts,
	eliminarDuplicados,
	anyadirSeguidor,
	anyadirSeguido,
	quitarSeguidor,
	quitarSeguido,
	comprobarFavs,
	formatearFechaTl,
	construirFiltroTl,
	eliminarSugerenciasSeguidos,
	obtenerMasPostsPorNumSeguidores,
	obtenerMasPostsPorNumFavs,
	esSeguidor,
	buscarUsuariosPorNombre,
	buscarUsuarioSeguido,
};
