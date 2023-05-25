const express = require("express");
const router = express.Router();

const { obtenerPostsPorTag } = require("../controllers/posts");

const comprobarUsuarioConectado = require("../middleware/auth");

router.route("/posts").get(comprobarUsuarioConectado, obtenerPostsPorTag).post(obtenerPostsPorTag);

module.exports = router;
