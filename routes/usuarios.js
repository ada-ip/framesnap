const express = require("express");
const router = express.Router();

const {
	registrarUsuario,
	comprobarUsuarioExiste,
	devolverPerfilUsuario,
	desconectarUsuario,
	obtenerNombresUsuarios,
	obtenerUsuarios,
	seguirUsuario,
	dejarSeguirUsuario,
	confirmarFotoPerfil,
} = require("../controllers/usuarios");

const { cargarImagen, subirFotoPerfilAS3 } = require("../middleware/multer");

router.route("/usuarios").get(obtenerUsuarios);
router.route("/usuarios/:usuario").get(devolverPerfilUsuario);
router.route("/api/v1/usuarios").post(registrarUsuario);
router.route("/api/v1/usuarios/:usuario").get(obtenerNombresUsuarios);
router.route("/api/v1/usuarios/:usuario/desconectar").post(desconectarUsuario);
router.route("/api/v1/usuarios/:usuario/dejardeseguir").patch(dejarSeguirUsuario);
router.route("/api/v1/usuarios/:usuario/seguir").patch(seguirUsuario);
router.route("/api/v1/usuarios/:usuario/validez").get(comprobarUsuarioExiste);
router
	.route("/api/v1/usuarios/:usuario/subirfotoperfil")
	.post(cargarImagen.single("imagenElegida"), subirFotoPerfilAS3, confirmarFotoPerfil);

module.exports = router;
