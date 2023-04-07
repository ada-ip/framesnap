const User = require("../models/User");

const devolverLogin = (req, res, next) => {
	try {
		if (!req.session.idUsuario) {
			res.render("login");
		} else {
			res.redirect("/");
		}
	} catch (error) {
		next(error);
	}
};

const devolverSignup = (req, res, next) => {
	try {
		if (!req.session.idUsuario) {
			res.render("signup");
		} else {
			res.redirect("/");
		}
	} catch (error) {
		next(error);
	}
};

const hacerLogin = async (req, res, next) => {
	const { correo, passw } = req.body;
	try {
		const usuario = await User.findOne({ correo });

		if (!usuario) {
			return res.render("login", { error: "usuario", mensaje: "El correo no está registrado", datos: [correo, passw] });
		}

		const passwValida = await usuario.compararPassw(passw);

		if (!passwValida) {
			return res.render("login", {
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
	devolverLogin,
	devolverSignup,
	hacerLogin
};
