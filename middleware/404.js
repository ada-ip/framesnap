/**
 * Este módulo define un middleware para manejar las rutas no encontradas (error 404).
 *
 */

/**
 * Este middleware renderiza una página de error 404.
 *
 * @param {Object} req      El objeto solicitud que representa la solicitud del cliente.
 * @param {Object} res      El objeto de respuesta de Express.
 * @returns {Response}      Renderiza la página de error 404.
 */
const error404 = (req, res) => res.status(404).render("errores/404");

module.exports = error404;
