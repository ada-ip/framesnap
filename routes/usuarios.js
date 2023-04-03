const express = require("express");
const router = express.Router();

const { registrarUsuario, comprobarUsuarioExiste } = require("../controllers/usuarios");

router.route("/").post(registrarUsuario);
router.route("/validez/:usuario").get(comprobarUsuarioExiste);

module.exports = router;
