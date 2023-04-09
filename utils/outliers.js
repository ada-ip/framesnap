const sumarSeguidoresOutliers = (usuarios) => {
	return usuarios.reduce((arrayUsuarios, usuario) => {
		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

		if (usuarioEncontrado) {
			usuarioEncontrado.numSeguidores += usuario.numSeguidores;
		} else {
			arrayUsuarios.push(usuario);
		}

		return arrayUsuarios;
	}, []);
};

const sumarSeguidosOutliers = (usuarios) => {
	return usuarios.reduce((arrayUsuarios, usuario) => {
		let usuarioEncontrado = arrayUsuarios.find((us) => us.nombre === usuario.nombre);

		if (usuarioEncontrado) {
			usuarioEncontrado.numSeguidos += usuario.numSeguidos;
		} else {
			arrayUsuarios.push(usuario);
		}

		return arrayUsuarios;
	}, []);
};

module.exports = { sumarSeguidoresOutliers, sumarSeguidosOutliers };
