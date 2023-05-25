const express = require("express");
const router = express.Router();

const { devolverPerfilUsuario, obtenerUsuarios } = require("../controllers/usuarios");

const comprobarUsuarioConectado = require("../middleware/auth");

router.route("/usuarios").get(comprobarUsuarioConectado, obtenerUsuarios);
router.route("/usuarios/:usuario").get(comprobarUsuarioConectado, devolverPerfilUsuario);

module.exports = router;
