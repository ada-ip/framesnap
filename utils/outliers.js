const LIMITE_ELEMENTOS = 1000;

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

const sumarSeguidoresYSeguidos = async (usuarios) => {
	const resultado = usuarios.map(async (usuario) => {
		if (usuario.outlierSeguidos || usuario.outlierSeguidores) {
			try {
				const seguidoresOutliers = await Follower.aggregate()
					.match({ "usuario.nombre": usuario })
					.group({ _id: "$usuario.nombre", numSeguidores: { $sum: { $size: "$seguidores" } } })
					.project({ _id: 0, nombre: "$_id", numSeguidores: 1 });

				const seguidosOutliers = await Follow.aggregate()
					.match({ "usuario.nombre": usuario })
					.group({ _id: "$usuario.nombre", numSeguidos: { $sum: { $size: "$seguidos" } } })
					.project({ _id: 0, nombre: "$_id", numSeguidos: 1 });

				return sumarSeguidoresOutliers([
					...sumarSeguidosOutliers([...usuario, ...seguidosOutliers]),
					...seguidoresOutliers
				]);
			} catch (error) {
				return usuario;
			}
		} else {
			return usuario;
		}
	});

	return await Promise.all(resultado);
};

module.exports = { sumarSeguidoresOutliers, sumarSeguidosOutliers, sumarSeguidoresYSeguidos };