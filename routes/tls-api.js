const express = require("express");
const router = express.Router();

const { esTlRepetido, crearTl, obtenerTl, borrarTl } = require("../controllers/tls");

const comprobarUsuarioConectado = require("../middleware/auth");

router.route("/").post(crearTl);
router.route("/:nombreTl").get(comprobarUsuarioConectado, obtenerTl).patch(borrarTl);
router.route("/:nombreTl/validez").get(comprobarUsuarioConectado, esTlRepetido);

module.exports = router;
