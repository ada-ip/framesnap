/**
 * Este módulo define las rutas para el registro y autenticación de la aplicación.
 *
 * '/iniciar-sesion':
 * - GET: Devuelve la página de inicio de sesión.
 * - POST: Procesa la solicitud de inicio de sesión y conecta al usuario.
 *
 * '/registrarse':
 * - GET: Devuelve la página de registro.
 */
const express = require("express");
const router = express.Router();

const { devolverIniciarSesion, devolverRegistrarse, conectarse } = require("../controllers/auth");

router.route("/iniciar-sesion").get(devolverIniciarSesion).post(conectarse);
router.route("/registrarse").get(devolverRegistrarse);

module.exports = router;
