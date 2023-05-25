const express = require("express");
const router = express.Router();

const {
	registrarUsuario,
	comprobarUsuarioExiste,
	desconectarUsuario,
	obtenerNombresUsuarios,
	seguirUsuario,
	dejarSeguirUsuario,
	confirmarFotoPerfil,
} = require("../controllers/usuarios");

const { cargarImagen, subirFotoPerfilAS3 } = require("../middleware/multer");
const comprobarUsuarioConectado = require("../middleware/auth");

router.route("/").post(registrarUsuario);
router.route("/:usuario").get(comprobarUsuarioConectado, obtenerNombresUsuarios);
router.route("/:usuario/desconectar").post(desconectarUsuario);
router.route("/:usuario/dejardeseguir").patch(dejarSeguirUsuario);
router.route("/:usuario/seguir").patch(seguirUsuario);
router.route("/:usuario/validez").get(comprobarUsuarioConectado, comprobarUsuarioExiste);
router.route("/:usuario/subirfotoperfil").post(cargarImagen.single("imagenElegida"), subirFotoPerfilAS3, confirmarFotoPerfil);

module.exports = router;
