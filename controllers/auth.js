const User = require("../models/User");

const devolverIniciarSesion = (req, res, next) => {
	try {
		if (!req.session.idUsuario) {
			res.render("iniciarSesion");
		} else {
			res.redirect("/");
		}
	} catch (error) {
		next(error);
	}
};

const devolverRegistrarse = (req, res, next) => {
	try {
		if (!req.session.idUsuario) {
			res.render("registrarse");
		} else {
			res.redirect("/");
		}
	} catch (error) {
		next(error);
	}
};

const conectarse = async (req, res, next) => {
	const { correo, passw } = req.body;
	try {
		const usuario = await User.findOne({ correo });

		if (!usuario) {
			return res.render("iniciarSesion", {
				error: "usuario",
				mensaje: "El correo no está registrado",
				datos: [correo, passw]
			});
		}

		const passwValida = await usuario.compararPassw(passw);

		if (!passwValida) {
			return res.render("IniciarSesion", {
				error: "contrasenya",
				mensaje: "La contraseña es incorrecta",
				datos: [correo, passw]
			});
		}

		req.session.idUsuario = usuario._id;
		req.session.usuario = usuario.nombre;

		res.redirect("/");
	} catch (error) {
		next(error);
	}
};

module.exports = {
	devolverIniciarSesion,
	devolverRegistrarse,
	conectarse
};
