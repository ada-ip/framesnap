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

module.exports = { sumarNumPosts, eliminarDuplicados };
