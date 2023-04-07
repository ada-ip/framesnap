const express = require("express");
const router = express.Router();

const {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario
} = require("../controllers/usuarios");

router.route("/:usuario").get(devolverPerfilUsuario);
router.route("/api/v1/usuarios").post(registrarUsuario);
router.route("/api/v1/usuarios/validez/:usuario").get(comprobarUsuarioExiste);
router.route("/api/v1/usuarios/desconectar/:usuario").post(desconectarUsuario);

module.exports = router;
