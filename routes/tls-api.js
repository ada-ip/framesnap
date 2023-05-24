const express = require("express");
const router = express.Router();

const { esTlRepetido, crearTl, obtenerTl, borrarTl } = require("../controllers/tls");

router.route("/").post(crearTl);
router.route("/:nombreTl").get(obtenerTl).patch(borrarTl);
router.route("/:nombreTl/validez").get(esTlRepetido);

module.exports = router;
