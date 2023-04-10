const sumarNumPosts = (usuarios, posts) =>
	usuarios.map((usuario) => {
		let usuarioEncontrado = posts.find((post) => post.nombre === usuario.nombre);
		if (usuarioEncontrado) {
			usuario.numPosts = usuarioEncontrado.numPosts;
		} else {
			usuario.numPosts = 0;
		}

		return usuario;
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
