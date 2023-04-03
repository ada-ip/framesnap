const User = require("../models/User");

const registrarUsuario = async (req, res, next) => {
	const usuario = {
		nombre: req.body.nombre,
		correo: req.body.correo,
		contrasenya: req.body.passw1,
		tls: [
			{
				nombre: "TL",
				config: {
					orden: {
						fecha: -1
					}
				}
			}
		]
	};
	try {
		const nuevoUsuario = new User(usuario);
		await nuevoUsuario.save();
		res.redirect("/login");
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

module.exports = {
	registrarUsuario,
	comprobarUsuarioExiste
};
