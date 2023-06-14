/**
 * Este módulo define un middleware para manejar errores generales.
 */

/**
 * Registra el stack del error en los logs del servidor y renderiza la página de error 500.
 *
 * @param {Error} err		El objeto error capturado.
 * @param {Object} req 		El objeto solicitud que representa la solicitud del cliente.
 * @param {Object} res 		El objeto de respuesta de Express.
 * @returns {Response}		Renderiza la página de error 500.
 */
const controlErrores = (err, req, res) => {
	console.error(err.stack);
	res.status(500).render("errores/500", { error: err });
};

module.exports = controlErrores;
