const User = require("../models/User");

const devolverIndex = async (req, res) => {
	if (!req.session.idUsuario) {
		res.redirect("/login");
	} else {
		try {
			const usuario = await User.findById(req.session.idUsuario).select("fotoPerfil tls");
			res.render("index", usuario);
		} catch (error) {
			next(error);
		}
	}
};

module.exports = devolverIndex;
