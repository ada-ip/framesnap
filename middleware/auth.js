/**
 * Este módulo define un middleware que comprueba si el usuario está conectado a la aplicación. Este middleware es útil
 * para impedir acceder a los usuarios a recursos a los que no deberían poder acceder.
 */

/**
 * Comprueba si el usuario está conectado
 *
 * @param {Object} req 		El objeto solicitud que representa la solicitud del cliente.
 * @param {Object} res 		El objeto de respuesta de Express.
 * @param {Function} next 	Callback para pasarle el control al siguiente middleware o controlador.
 * @returns {Response}		Redirige a la página de inicio de sesión si el usuario no está conectado. Si sí está conectado
 * 							se utiliza el callback next.
 */
const comprobarUsuarioConectado = (req, res, next) => {
	if (!req.session.idUsuario) {
		res.redirect("/iniciar-sesion");
	} else {
		next();
	}
};

module.exports = comprobarUsuarioConectado;
