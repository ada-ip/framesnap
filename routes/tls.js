const express = require("express");
const router = express.Router();

const { esTlRepetido, crearTl, obtenerTl } = require("../controllers/tls");

router.route("/").post(crearTl);
router.route("/:nombreTl").get(obtenerTl);
router.route("/:nombreTl/validez").get(esTlRepetido);

module.exports = router;
