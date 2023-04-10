const express = require("express");
const router = express.Router();

const {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario,
	obtenerNombresUsuarios,
	obtenerUsuarios
} = require("../controllers/usuarios");

router.route("/usuarios").get(obtenerUsuarios);
router.route("/usuarios/:usuario").get(devolverPerfilUsuario);
router.route("/api/v1/usuarios").post(registrarUsuario);
router.route("/api/v1/usuarios/:usuario").get(obtenerNombresUsuarios);
router.route("/api/v1/usuarios/validez/:usuario").get(comprobarUsuarioExiste);
router.route("/api/v1/usuarios/desconectar/:usuario").post(desconectarUsuario);

module.exports = router;
