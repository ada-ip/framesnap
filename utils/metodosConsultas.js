const LIMITE_ELEMENTOS = 1000;
const User = require("../models/User");
const Follower = require("../models/Follower");
const Follow = require("../models/Follow");

const sumarNumPosts = (usuarios, posts) =>
	usuarios.map((usuario) => {
		let usuarioEncontrado = posts.find((post) => post.nombre === usuario.nombre);
		if (usuarioEncontrado) {
			return { ...usuario.toObject(), numPosts: usuarioEncontrado.numPosts };
		} else {
			return { ...usuario.toObject(), numPosts: 0 };
		}
	});

const eliminarDuplicados = (usuarios) =>
	usuarios.reduce((arrayUsuarios, usuario) => {
		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

		if (!usuarioEncontrado) {
			arrayUsuarios.push(usuario);
		}
		return arrayUsuarios;
	}, []);

const anyadirSeguidor = async (usuarioASeguir, usuarioLogeado, sesion) => {
	if (!usuarioASeguir.outlierSeguidores && usuarioASeguir.numSeguidores < LIMITE_ELEMENTOS) {
		usuarioASeguir.seguidores.push({
			id: usuarioLogeado._id,
			nombre: usuarioLogeado.nombre,
			fotoPerfil: usuarioLogeado.fotoPerfil
		});
		usuarioASeguir.numSeguidores++;
		await usuarioASeguir.save({ session: sesion });
	} else {
		const usuarioOutlier = await Follower.find({ nombre: usuarioASeguir.nombre }, null, { session: sesion })
			.sort("-doc")
			.limit(1);

		if (usuarioOutlier.length === 0 || usuarioOutlier[0].seguidores.length === LIMITE_ELEMENTOS) {
			const nuevoUsuarioParams = {
				usuario: { id: usuarioASeguir._id, nombre: usuarioASeguir.nombre, fotoPerfil: usuarioASeguir.fotoPerfil },
				doc: usuarioOutlier[0].doc + 1 || 1,
				seguidores: [{ id: usuarioLogeado._id, nombre: usuarioLogeado.nombre, fotoPerfil: usuarioLogeado.fotoPerfil }]
			};

			const nuevoUsuarioOutlier = new Follower(nuevoUsuarioParams);
			await nuevoUsuarioOutlier.save({ session: sesion });

			if (usuarioOutlier.length === 0) usuarioASeguir.outlierSeguidores = true;
			usuarioASeguir.numSeguidores++;
			await usuarioASeguir.save({ session: sesion });
		} else {
			usuarioOutlier[0].seguidores.push({
				id: usuarioLogeado._id,
				nombre: usuarioLogeado.nombre,
				fotoPerfil: usuarioLogeado.fotoPerfil
			});

			await usuarioOutlier.save({ session: sesion });

			usuarioASeguir.numSeguidores++;
			await usuarioASeguir.save({ session: sesion });
		}
	}
};

const anyadirSeguido = async (usuarioASeguir, usuarioLogeado, sesion) => {
	if (!usuarioLogeado.outlierSeguidos && usuarioLogeado.numSeguidos < LIMITE_ELEMENTOS) {
		usuarioLogeado.seguidos.push({
			id: usuarioASeguir._id,
			nombre: usuarioASeguir.nombre,
			fotoPerfil: usuarioASeguir.fotoPerfil
		});
		usuarioLogeado.numSeguidos++;
		await usuarioLogeado.save({ session: sesion });
	} else {
		const usuarioOutlier = await Follow.find({ nombre: usuarioLogeado.nombre }, null, { session: sesion })
			.sort("-doc")
			.limit(1);

		if (usuarioOutlier.length === 0 || usuarioOutlier[0].seguidos.length === LIMITE_ELEMENTOS) {
			const nuevoUsuarioParams = {
				usuario: { id: usuarioLogeado._id, nombre: usuarioLogeado.nombre, fotoPerfil: usuarioLogeado.fotoPerfil },
				doc: usuarioOutlier[0].doc + 1 || 1,
				seguidos: [{ id: usuarioASeguir._id, nombre: usuarioASeguir.nombre, fotoPerfil: usuarioASeguir.fotoPerfil }]
			};

			const nuevoUsuarioOutlier = new Follow(nuevoUsuarioParams);
			await nuevoUsuarioOutlier.save({ session: sesion });

			if (usuarioOutlier.length === 0) usuarioLogeador.outlierSeguidos = true;
			usuarioLogeado.numSeguidos++;
			await usuarioLogeado.save({ session: sesion });
		} else {
			usuarioOutlier[0].seguidos.push({
				id: usuarioASeguir._id,
				nombre: usuarioASeguir.nombre,
				fotoPerfil: usuarioASeguir.fotoPerfil
			});

			await usuarioOutlier.save({ session: sesion });

			usuarioLogeado.numSeguidos++;
			await usuarioLogeado.save({ session: sesion });
		}
	}
};

module.exports = { sumarNumPosts, eliminarDuplicados, anyadirSeguidor, anyadirSeguido };
