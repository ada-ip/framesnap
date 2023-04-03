const User = require("../models/User");

const devolverLogin = (req, res, next) => {
	try {
		res.render("login");
	} catch (error) {
		next(error);
	}
};

const devolverSignup = (req, res, next) => {
	try {
		res.render("signup");
	} catch (error) {
		next(error);
	}
};

const hacerLogin = async (req, res, next) => {
	const { correo, passw, registrate } = req.body;
	if (registrate) {
		res.redirect("/signup");
	} else {
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
	}
};

module.exports = {
	devolverLogin,
	devolverSignup,
	hacerLogin
};
