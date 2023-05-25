/**
 * Este módulo define la ruta de la página principal de la aplicación.
 *
 * '/':
 * - GET: Devuelve el index de la aplicación con los datos del usuario si el usuario se ha conectado.
 */

const express = require("express");
const router = express.Router();

const devolverIndex = require("../controllers/index");

const comprobarUsuarioConectado = require("../middleware/auth");

router.route("/").get(comprobarUsuarioConectado, devolverIndex);

module.exports = router;
