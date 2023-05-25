const comprobarUsuarioConectado = (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		next();
	}
};

module.exports = comprobarUsuarioConectado;
