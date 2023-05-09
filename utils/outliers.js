/**
 * Funciones para gestionar los posibles posts cuya información pueda estar almacenada tanto en la colección principal
 * como en las colecciones auxiliares
 *
 * Funciones:
 * - comprobarFavs: Comprueba si un usuario en concreto ha favoriteado un conjunto de posts
 */

// Se importan los modelos Mongoose necesarios
const Fav = require("../models/Fav");
const Post = require("../models/Post");

// const sumarSeguidoresOutliers = (usuarios) => {
// 	return usuarios.reduce((arrayUsuarios, usuario) => {
// 		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

// 		if (usuarioEncontrado) {
// 			usuarioEncontrado.numSeguidores += usuario.numSeguidores;
// 		} else {
// 			arrayUsuarios.push(usuario);
// 		}

// 		return arrayUsuarios;
// 	}, []);
// };

// const sumarSeguidosOutliers = (usuarios) => {
// 	return usuarios.reduce((arrayUsuarios, usuario) => {
// 		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

// 		if (usuarioEncontrado) {
// 			usuarioEncontrado.numSeguidos += usuario.numSeguidos;
// 		} else {
// 			arrayUsuarios.push(usuario);
// 		}

// 		return arrayUsuarios;
// 	}, []);
// };

// const sumarSeguidoresYSeguidos = async (usuarios) => {
// 	const resultado = usuarios.map(async (usuario) => {
// 		if (usuario.outlierSeguidos || usuario.outlierSeguidores) {
// 			try {
// 				const seguidoresOutliers = await Follower.aggregate()
// 					.match({ "usuario.nombre": usuario })
// 					.group({ _id: "$usuario.nombre", numSeguidores: { $sum: { $size: "$seguidores" } } })
// 					.project({ _id: 0, nombre: "$_id", numSeguidores: 1 });

// 				const seguidosOutliers = await Follow.aggregate()
// 					.match({ "usuario.nombre": usuario })
// 					.group({ _id: "$usuario.nombre", numSeguidos: { $sum: { $size: "$seguidos" } } })
// 					.project({ _id: 0, nombre: "$_id", numSeguidos: 1 });

// 				return sumarSeguidoresOutliers([
// 					...sumarSeguidosOutliers([...usuario, ...seguidosOutliers]),
// 					...seguidoresOutliers,
// 				]);
// 			} catch (error) {
// 				return usuario;
// 			}
// 		} else {
// 			return usuario;
// 		}
// 	});

// 	return await Promise.all(resultado);
// };

/**
 * Comprueba si un usuario ha favoriteado o no los posts de un conjunto de posts
 * @param {Array.<Object>} posts	Un array de posts que tienen que tener como mínimo la siguiente propiedad:
 * 									- _id
 * @param {*} req
 * @returns
 */
// const comprobarFavs = async (posts, idUsuario) => {
// 	const resultado = posts.map(async (post) => {
// 		const esFavorito = await Post.findOne({ _id: post._id, "favs.id": idUsuario });
// 		let esFavoritoOutlier;
// 		if (post.outlierFavs && !esFavorito) {
// 			esFavoritoOutlier = await Fav.findOne({ idPost: post._id, "favs.id": idUsuario });
// 		}
// 		if (esFavorito || esFavoritoOutlier) {
// 			return { ...post, esFavorito: true };
// 		} else {
// 			return { ...post, esFavorito: false };
// 		}
// 	});

// 	return await Promise.all(resultado);
// };

// module.exports = { sumarSeguidoresOutliers, sumarSeguidosOutliers, sumarSeguidoresYSeguidos, comprobarFavs };
