const express = require("express");
const router = express.Router();

const { esTlRepetido, crearTl } = require("../controllers/tls");

router.route("/").post(crearTl);
router.route("/:nombreTL/validez").get(esTlRepetido);

module.exports = router;
