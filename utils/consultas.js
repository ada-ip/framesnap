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
 * - quitarSeguidor: Le quita un seguidor a un usuario determinado.
 * - quitarSeguido: Elimina a un usuario determinado de la lista de usuarios seguidos del usuario conectado.
 * - comprobarFavs: Comprueba si un usuario ha favoriteado o no los posts de un conjunto de posts.
 * - formatearFechaTl: Convierte la fecha por la que hay que filtrar los posts de un timeline en un formato
 * 					   apropiado para pasárselo a las vistas.
 * - construirFiltroTl: Convierte la configuración de un timeline almacenada en la base de datos en un objeto por el que filtrar
 * 						en las consultas a la base de datos.
 * - eliminarSugerenciasSeguidos: Elimina de la lista de usuarios sugeridos los usuarios a los que ya sigue el usuario conectado
 * 								  a la aplicación.
 * - obtenerMasPostsPorNumSeguidores: Devuelve los siguientes posts de un timeline del usuario basándose en el número de seguidores
 * 									  de los autores de los posts.
 * - obtenerMasPostsPorNumFavs: Devuelve un conjunto de posts según un filtro determinado basándose en el número de favoritos de los posts.
 * - esSeguidor: Revisa si el usuario actual (el conectado) es seguidor de un conjunto de usuarios.
 * - buscarUsuariosPorNombre: Busca usuarios cuyo nombre comience por un conjunto de caracteres determinado y devuelve sus posts.
 * - buscarUsuarioSeguido: Busca usuarios a los que siga el usuario conectado cuyo nombre comience por un conjunto de caracteres determinado y
 * 						   devuelve sus posts.
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
 * @function sumarNumPosts
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
 * @function eliminarDuplicados
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
 * @async
 * @function anyadirSeguidor
 * @param {Object} usuarioASeguir	El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se
 * 									se le quiere añadir un seguidor. Tiene que tener como mínimo las siguientes propiedades:
 * 									- _id: el id del usuario a seguir.
 * 									- nombre: el nombre del usuario a seguir.
 * 									- fotoPerfil: la url de la foto de perfil del usuario a seguir.
 * 									- seguidores: los seguidores del usuario a seguir.
 * 									- numSeguidores: el nº de seguidores del usuario a seguir.
 * 									- outlierSeguidores: si el usuario tiene seguidores guardados en la colección auxiliar.
 * @param {Object} usuarioLogeado	El usuario (objeto resultado de una consulta a la colección users de la base de datos) que se va
 * 									a añadir como nuevo seguidor (el usuario con sesión abierta). Tiene que tener las siguientes
 * 									propiedades:
 * 									- _id: el id del usuario que va a seguir al usuario anterior.
 * 									- nombre: el nombre del usuario que va a seguir al usuario anterior.
 * 									- fotoPerfil: la url de la foto de perfil del usuario que va a seguir al usuario anterior.
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
 * @async
 * @function anyadirSeguido
 * @param {Object} usuarioASeguir 	El usuario (objeto resultado de una consulta a la colección users de la base de datos) que se va a
 * 									añadir como usuario seguido al usuario conectado. Tiene que tener como mínimo las siguientes propiedades:
 * 									- _id: el id del usuario que se va a añadir como usuario seguido.
 * 									- nombre: el nombre del usuario que se va a añadir como usuario seguido.
 * 									- fotoPerfil: la url de la foto de perfil que se va a añadir como usuario seguido.
 * @param {Object} usuarioLogeado 	El usuario conectado (objeto resultado de una consulta a la colección users de la base de datos) al que
 * 									se le vaba añadir un nuevo usuario seguido. Tiene que tener como mínimo las siguientes propiedades:
 * 									- _id: el id del usuario que quiere seguir al usuario anterior.
 * 									- nombre: el nombre del usuario que quiere seguir al usuario anterior.
 * 									- fotoPerfil: la url de la foto de perfil del usuario que quiere seguir al usuario anterior.
 * 									- seguidores: los seguidores del usuario que quiere seguir al usuario anterior.
 * 									- numSeguidores: el nº de seguidores del usuario que quiere seguir al usuario anterior.
 * 									- outlierSeguidores: si el usuario conectado tiene seguidores guardados en la colección auxiliar.
 * @param {ClientSession} sesion 	Una sesión de Mongoose que controle una transacción.
 */
const anyadirSeguido = async (usuarioASeguir, usuarioLogeado, sesion) => {
	/* Si el usuario conectado al que se le va añadir un nuevo usuario seguido no ha llegado al límite de usuarios seguidos que se pueden 
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
 * Le quita un seguidor a un usuario determinado.
 *
 * @async
 * @function quitarSeguidor
 * @param {Object} usuarioADejarDeSeguir   El usuario (objeto resultado de una consulta a la colección users de la base de datos) al que se
 * 										   le va a quitar el seguidor. Tiene que tener como mínimo las siguientes propiedades:
 * 										   - _id: el id del usuario al que se le va a quitar el seguidor.
 * 										   - seguidores: los seguidores del usuario.
 * 										   - numSeguidores: el nº de seguidores del usuario.
 * @param {Object} usuarioLogeado		   El usuario (objeto resultado de una consulta a la colección users de la base de datos) que se va
 * 										   eliminar de la lista de seguidores del usuario anterior. Tiene que tener como mínimo las
 * 										   siguientes propiedades:
 * 										   - _id: el id del usuario que se va a eliminar de la lista de seguidores.
 * 										   - nombre: el nombre del usuario que se va a eliminar de la lista de seguidores.
 * @param {ClientSession} sesion		   Una sesión de Mongoose que controle una transacción.
 */
const quitarSeguidor = async (usuarioADejarDeSeguir, usuarioLogeado, sesion) => {
	// Se comprueba si el usuario conectado se encuentra en el array de seguidores del usuario a dejar de seguir
	let indexUsuarioLogeado = usuarioADejarDeSeguir.seguidores.findIndex((seguidor) => seguidor.nombre === usuarioLogeado.nombre);
	/* Si está en el array, se elimina el usuario directamente, y si no está, se borra de la lista de seguidores del usuario en 
	la colección auxiliar followers */
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
	// Se modifica el nº de seguidores del usuario y se guarda
	usuarioADejarDeSeguir.numSeguidores--;
	await usuarioADejarDeSeguir.save({ session: sesion });
};

/**
 * Elimina a un usuario determinado de la lista de usuarios seguidos del usuario conectado.
 *
 * @async
 * @function quitarSeguido
 * @param {Object} usuarioADejarDeSeguir	El usuario (objeto resultado de una consulta a la colección users de la base de datos) al
 * 											que se va a dejar de seguir. Tiene que tener como mínimo las siguientes propiedades:
 * 										    - _id: el id del usuario al que se va a dejar de seguir.
 * 										    - nombre: el nombre del usuario al que se va a dejar de seguir.
 * @param {Object} usuarioLogeado			El usuario (objeto resultado de una consulta a la colección users de la base de datos) que
 * 											va a dejar de seguir al usuario anterior. Tiene que tener como mínimo las siguientes
 * 											propiedades:
 * 										    - _id: el id del usuario que va dejar de seguir al usuario anterior.
 * 										    - seguidos: los usuarios a los que sigue el usuario que va a dejar de seguir al usuario
 * 											anterior.
 * 											- numSeguidos: el nº de usuarios a los que sigue el usuario que va a dejar de seguir al
 * 											usuario anterior.
 * @param {ClientSession} sesion			Una sesión de Mongoose que controle una transacción.
 */
const quitarSeguido = async (usuarioADejarDeSeguir, usuarioLogeado, sesion) => {
	// Se comprueba si el usuario a dejar de seguir se encuentra en el array de seguidos del usuario conectado
	let indexUsuarioADejarDeSeguir = usuarioLogeado.seguidos.findIndex(
		(seguido) => seguido.nombre === usuarioADejarDeSeguir.nombre
	);
	/* Si está en el array, se elimina el usuario directamente, y si no está, se borra de la lista de seguidos del usuario en 
	la colección auxiliar follows */
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
	// Se modifica el nº de seguidos del usuario y se guarda
	usuarioLogeado.numSeguidos--;
	await usuarioLogeado.save({ session: sesion });
};

/**
 * Comprueba si un usuario ha favoriteado o no los posts de un conjunto de posts.
 *
 * @async
 * @function comprobarFavs
 * @param {Array.<Object>} posts	Un array de posts que tienen que tener como mínimo la siguiente propiedad:
 * 									- _id: el id del post en la base de datos.
 * 									- outlierFavs: si el post tiene favoritos guardados en la colección auxiliar favs o no.
 * @param {String} idUsuario		El id del usuario del que se quiere comprobar si ha favoriteado o no los posts.
 * @returns {Array.<Object>}		Un array con los posts originales más la propiedad añadida de esFavorito.
 */
const comprobarFavs = async (posts, idUsuario) => {
	// Se le añade a cada post la propiedad de esFavorito
	const resultado = posts.map(async (post) => {
		// Se comprueba si el usuario ha favoriteado el post tanto en la colección principal de posts como en la auxiliar.
		const esFavorito = await Post.findOne({ _id: post._id, "favs.id": idUsuario });
		let esFavoritoOutlier;
		if (post.outlierFavs && !esFavorito) {
			esFavoritoOutlier = await Fav.findOne({ idPost: post._id, "favs.id": idUsuario });
		}
		if (esFavorito || esFavoritoOutlier) {
			return { ...(post.toObject ? post.toObject() : post), esFavorito: true };
		} else {
			return { ...(post.toObject ? post.toObject() : post), esFavorito: false };
		}
	});

	return await Promise.all(resultado);
};

/**
 * Convierte la fecha por la que hay que filtrar los posts de un timeline en un formato apropiado para pasárselo a las vistas.
 *
 * @function formatearFechaTl
 * @param {Number|String} fecha 	La fecha por la que hay que filtrar los posts
 * @returns {Object}				Un objeto con las siguientes propiedades:
 * 									- opcion: la opción que ha debido de elegir el usuario a la hora de crear el timeline.
 * 									- $gte: la fecha desde la que hay que filtrar si el usuario ha elegido la opción de elegir.
 * 									- $lte: la fecha hasta la que hay que filtrar si el usuario ha elegido la opción de elegir.
 */
const formatearFechaTl = (fecha) => {
	const fechaFormateada = {};

	if (typeof fecha.$gte === "number") {
		// Si la fecha es un número, se guarda la opción que corresponda del select que se muestra en el modal de crear tl
		const tiempo = {
			1: "dia",
			7: "semana",
			30: "mes",
			180: "smes",
		};
		fechaFormateada.opcion = tiempo[`${fecha.$gte / (24 * 60 * 60 * 1000)}`];
	} else {
		// Si la fecha no es un número, se guardan las fechas desde y hasta directamente
		fechaFormateada.opcion = "elegir";
		fechaFormateada.$gte = fecha.$gte;
		if (fecha.$lte) fechaFormateada.$lte = fecha.$lte;
	}
	return fechaFormateada;
};

/**
 * Convierte la configuración de un timeline almacenada en la base de datos en un objeto por el que filtrar
 * en las consultas a la base de datos.
 *
 * @function construirFiltroTl
 * @param {Object} tl	Un objeto tl que representa un tl de un usuario almacenado en la base de datos. Puede tener las siguientes
 * 						propiedades:
 * 						- config.filtro.autor: un array de usuarios cuyos posts se quieren mostrar en el timeline.
 * 						- config.filtro.tags: un array de tags cuyos posts se quieren mostrar en el timeline.
 * 						- config.filtro.fecha.$gte: la fecha de los posts desde la que se quiere filtrar.
 * 						- config.filtro.fecha.$lte: la fecha de los posts hasta la que se quiere filtrar.
 * @returns {Object}	Un objeto formateado correctamente a partir de los datos del objeto tl para poderlo introducir
 * 						directamente en un método find de una consulta de Mongo/Mongoose.
 */
const construirFiltroTl = (tl) => {
	// Se crea la propiedad en la que se van a meter los autores de los posts y los tags si estos existen
	const filtro = {
		$or: [],
	};

	// Se añaden los autores de los posts al filtro
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

	// Se añaden los tags al filtro
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

	// Se añaden las fechas por las que se quiere filtrar al filtro
	if (typeof tl.config.filtro.fecha.$gte === "number") {
		/* Si en la bbdd se ha guardado como fecha desde la que filtrar, milisegundos que corresponden a un día, semana
		mes, etc, se calcula la fecha desde la que hay que filtrar */
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

/**
 * Elimina de la lista de usuarios sugeridos los usuarios a los que ya sigue el usuario conectado a la aplicación.
 *
 * @async
 * @function eliminarSugerenciasSeguidos
 * @param {Array.<Object>} usuarios		Un array de usuarios (objeto resultado de una consulta a la colección users de la base de datos)
 * 										sugeridos. Tiene que tener como mínimo la siguiente propiedad:
 * 										- nombre: el nombre del usuario correspollk0ndiente.
 * @param {String} usuarioLogeado		El id del usuario conectado a la aplicación.
 * @returns {Array.<Object>}			Un array de usuarios que no incluye a los usuarios a los que sigue el usuario conectado.
 */
const eliminarSugerenciasSeguidos = async (usuarios, usuarioLogeado) => {
	// Se recogen los usuarios a los que sigue el usuario conectado
	const seguidos = await User.findById(usuarioLogeado).select("-_id seguidos outlierSeguidos");
	const seguidosOutlier = [];
	if (seguidos.outlierSeguidos) {
		const masSeguidos = await Follow.find({ "usuario.id": usuarioLogeado }).select("-_id seguidos");
		masSeguidos.forEach((doc) => seguidosOutlier.push(...doc.seguidos));
	}

	// Se crea un nuevo array de usuarios sugeridos sin los usuarios a los que sigue el usuario conectado
	return usuarios.reduce((arrayUsuarios, usuario) => {
		// Se busca cada usuario sugerido en la lista de seguidos de la colección principal del usuario conectado
		let i = seguidos.seguidos.findIndex((seguido) => seguido.nombre === usuario.nombre);
		// Se busca cada usuario sugerido en la lista de seguidos de la colección auxiliar del usuario conectado si ésta existe
		let iOutlier = -1;
		if (seguidosOutlier.length > 0) {
			iOutlier = seguidosOutlier.seguidos.findIndex((seguido) => seguido.nombre === usuario.nombre);
		}

		// Si no se ha encontrado el usuario en ninguna de las dos listas, se añade al nuevo array
		if (i === -1 && iOutlier === -1) arrayUsuarios.push(usuario);

		// Se devuelve el nuevo array
		return arrayUsuarios;
	}, []);
};

/**
 * Devuelve los siguientes posts de un timeline del usuario basándose en el número de seguidores de los autores de los posts.
 *
 * @async
 * @function obtenerMasPostsPorNumSeguidores
 * @param {Object} filtro 				Objeto que contiene los datos por los que se quieren filtrar los posts.
 * @param {Date} fechaPost 				La fecha del último post mostrado en el timeline del usuario.
 * @param {Object} filtroSeguidores 	Objeto que contiene el número de seguidores del autor del último post mostrado
 * 										en el timeline del usuario. Tiene que tener la siguiente propiedad:
 * 										- datosAutor.numSeguidores: el nº de seguidores del autor del post.
 * @param {string} orden 				El campo de la colección por el que se quieren ordenar los posts.
 * @param {number} datoPost 			El número de seguidores del autor del último post mostrado en el timeline del usuario.
 * @returns {Array.<Object>} 			Un array con los nuevos posts a mostrar en el timeline.
 *
 */
const obtenerMasPostsPorNumSeguidores = async (filtro, fechaPost, filtroSeguidores, orden, datoPost) => {
	/* Se hace una consulta para obtener 10 posts cuyos autores tengan el mismo nº de seguidores que el autor del último
	post mostrado en el timeline del usuario, pero que cuya fecha sea menor a la del post */
	filtro.fecha.$lt = new Date(fechaPost);
	const posts = await Post.aggregate()
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

	/* Si no se han encontrado 10 posts que cumplan con los requisitos, se hace otra consulta para obtener posts cuyos autores tengan
	un nº diferente de seguidores que el autor del último post mostrado en el timeline del usuario */
	if (posts.length < 10) {
		// Se buscan posts de autores con menos o más seguidores según si se quiere ordenar de más a menos nº de seguidores o al revés
		if (orden.substring(0, orden.indexOf(" ")) === "-numSeguidores") {
			filtroSeguidores["datosAutor.numSeguidores"] = { $lt: parseInt(datoPost) };
		} else {
			filtroSeguidores["datosAutor.numSeguidores"] = { $gt: parseInt(datoPost) };
		}

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

/**
 * Devuelve los siguientes posts de un timeline del usuario basándose en el número de favoritos de los posts.
 *
 * @async
 * @function obtenerMasPostsPorNumFavs
 * @param {Object} filtro 				Objeto que contiene los datos por los que se quieren filtrar los posts. Tiene que tener
 * 										como mínimo la siguiente propiedad:
 * 										- numFavs: el nº de favoritos del último post mostrado en el timeline del usuario.
 * @param {Date} fechaPost 				La fecha del último post mostrado en el timeline del usuario.
 * @param {string} orden 				El campo de la colección por el que se quieren ordenar los posts.
 * @param {number} datoPost 			El número de favoritos del último post mostrado en el timeline del usuario.
 * @returns {Array.<Object>} 			Un array con los nuevos posts a mostrar en el timeline.
 */
const obtenerMasPostsPorNumFavs = async (filtro, fechaPost, orden, datoPost) => {
	/* Se hace una consulta para obtener 10 posts que tengan el mismo nº de favoritos que el último
	post mostrado en el timeline del usuario, pero que cuya fecha sea menor a la del post */
	filtro.fecha.$lt = new Date(fechaPost);
	const posts = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden).limit(10);

	/* Si no se han encontrado 10 posts que cumplan con los requisitos, se hace otra consulta para obtener posts que tengan
	un nº diferente de favoritos al del último post mostrado en el timeline del usuario */
	if (posts.length < 10) {
		// Se buscan posts con más o menos favoritos según si se quiere ordenar de más a menos favoritos o al revés
		if (orden.substring(0, orden.indexOf(" ")) === "-numFavs") {
			filtro.numFavs = { $lt: parseInt(datoPost) };
		} else {
			filtro.numFavs = { $gt: parseInt(datoPost) };
		}

		const postsOtrosFavoritos = await Post.find(filtro).select("-favs -outlierComentarios -tags").sort(orden).limit(10);

		posts.push(...postsOtrosFavoritos);
	}
	return posts;
};

/**
 * Revisa si el usuario actual (el conectado) es seguidor de un conjunto de usuarios.
 *
 * @async
 * @function esSeguidor
 * @param {Array.<Object>} usuarios		Un array de objectos usuario (objeto resultado de una consulta a la colección
 * 										users de la base de datos). Tiene que tener como mínimo la siguiente propiedad:
 * 										- nombre: el nombre del usuario.
 * @param {String} idUsuario 			El id del usuario conectado.
 * @returns {Array.<Object>} 			El conjunto de usuarios con la propiedad extra de esSeguidor que indica si el usuario
 * 										conectado es seguidor de cada usuario.
 */
const esSeguidor = async (usuarios, idUsuario) => {
	const resultado = await Promise.all(
		// Se comprueba si el usuario conectado sigue a cada usuario y se añade esa información como una nueva propiedad
		usuarios.map(async (usuario) => {
			const esSeguidor = await User.findOne({ nombre: usuario.nombre, "seguidores.id": idUsuario }).select("nombre");
			const esSeguidorOutlier = await Follower.findOne({
				"usuario.nombre": usuario.nombre,
				"seguidores.id": idUsuario,
			}).select("nombre");

			// Se devuelve el objeto del usuario analizado con la información extra de si el usuario conectado le sigue o no
			return {
				...(usuario.toObject ? usuario.toObject() : usuario),
				esSeguidor: esSeguidor || esSeguidorOutlier ? true : false,
			};
		})
	);

	return resultado;
};

/**
 * Busca usuarios cuyo nombre comience por un conjunto de caracteres determinado y devuelve sus posts.
 *
 * @async
 * @function buscarUsuariosPorNombre
 * @param {string} comienzoUsuario 	Los caracteres por los que tiene que empezar el nombre del usuario.
 * @param {Object} req 				El objeto petición del cliente.
 * @param {number} skip 			El número de resultados que hay que saltarse en la consulta porque ya se hayan
 * 									devuelto esos usuarios con anterioridad.
 * @returns {Array.<Object>} 		Un conjunto de objetos usuario cuyo nombre comience por el conjunto de caracteres.
 *
 */
const buscarUsuariosPorNombre = async (comienzoUsuario, req, skip) => {
	const usuarios = [];

	// Se crea la expresión regular para poder buscar en la bbdd usuarios cuyo nombre comience por esos caracteres
	const regex = new RegExp(`^${comienzoUsuario}`, "i");

	// Primero se obtienen todos los usuarios que cumplan con la expresión regular y también el nº de posts que han creado
	const postsUsuarios = await Post.aggregate()
		.match({ $and: [{ "autor.nombre": regex }, { "autor.nombre": { $ne: req.session.usuario } }] })
		.group({ _id: "$autor.nombre", numPosts: { $sum: 1 } })
		.project({
			_id: 0,
			nombreAutor: "$_id",
			numPosts: 1,
		});

	// Primero se buscan usuarios que cumplan con la expresión regular y que sean usuarios seguidos del usuario conectado
	const usuariosSeguidos = await buscarUsuarioSeguido(req, regex, skip, postsUsuarios);
	usuarios.push(...usuariosSeguidos);

	// Después se buscan usuarios que cumplan con la expresión regular en general
	const otrosUsuarios = await User.find({ $and: [{ nombre: regex }, { nombre: { $ne: req.session.usuario } }] })
		.select("_id nombre fotoPerfil numSeguidos numSeguidores")
		.sort("nombre")
		.skip(skip)
		.limit(15);

	// Se obtienen las urls públicas de las imágenes de perfil de los usuarios
	if (otrosUsuarios.length > 0) {
		const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(otrosUsuarios, postsUsuarios), req);
		usuarios.push(...usuariosConSignedUrl);
	}

	return usuarios;
};

/**
 * Busca usuarios a los que siga el usuario conectado cuyo nombre comience por un conjunto de caracteres determinado y
 * devuelve sus posts.
 *
 * La función utiliza la colección User y Follow para realizar las consultas necesarias en la base de datos.
 *
 * @async
 * @function buscarUsuarioSeguido
 * @param {object} req 			  El objeto petición del cliente.
 * @param {RegExp} regex 		  La expresión regular utilizada para buscar usuarios seguidos.
 * @param {number} skip 		  Número de usuarios que hay saltarse en los resultados de la búsqueda.
 * @param {Array} postsUsuarios   Conjunto de objetos post (resultado de una consulta a la colección posts de la bbdd) que
 * 								  pueden incluir o no posts de los usuarios que se están buscando. Tienen que tener como mínimo la siguiente
 * 								  propiedad:
 * 								  - numPosts: el nº de posts que ha creado el autor de cada post.
 * @returns {Array.<Object>}      Un conjunto de objetos usuario.
 */
const buscarUsuarioSeguido = async (req, regex, skip, postsUsuarios) => {
	const usuarios = [];

	/* Se buscan los usuarios a los que siga el usuario conectado y cuyo nombre coincida con la expresión regular en la 
	colección principal */
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

	// Se les añade la url pública de sus imágenes de perfil a los usuarios encontrados
	if (usuariosSeguidos.length > 0) {
		const usuariosConSignedUrl = anyadirSignedUrlsUsuario(sumarNumPosts(usuariosSeguidos, postsUsuarios), req);
		usuarios.push(...usuariosConSignedUrl);
	}

	/* Se buscan los usuarios a los que siga el usuario conectado y cuyo nombre coincida con la expresión regular en la 
	colección auxiliar */
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

	// Se les añade la url pública de sus imágenes de perfil a los usuarios encontrados
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
