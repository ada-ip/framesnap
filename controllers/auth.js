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
	const { nombre, passw } = req.body;
	try {
		const usuario = await User.findOne({ nombre: nombre });

		if (!usuario) {
			return res.render("iniciarSesion", {
				error: "usuario",
				mensaje: "El usuario no está registrado",
				datos: [nombre, passw],
			});
		}

		const passwValida = await usuario.compararPassw(passw);

		if (!passwValida) {
			res.render("iniciarSesion", {
				error: "contrasenya",
				mensaje: "La contraseña es incorrecta",
				datos: [nombre, passw],
			});
		} else {
			req.session.idUsuario = usuario._id;
			req.session.usuario = usuario.nombre;
			req.session.fotoPerfil = usuario.fotoPerfil;

			res.redirect("/");
		}
	} catch (error) {
		next(error);
	}
};

module.exports = {
	devolverIniciarSesion,
	devolverRegistrarse,
	conectarse,
};
