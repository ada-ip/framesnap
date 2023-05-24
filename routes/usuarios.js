const express = require("express");
const router = express.Router();

const { devolverPerfilUsuario, obtenerUsuarios } = require("../controllers/usuarios");

router.route("/usuarios").get(obtenerUsuarios);
router.route("/usuarios/:usuario").get(devolverPerfilUsuario);

module.exports = router;
