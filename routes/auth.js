const express = require("express");
const router = express.Router();

const { devolverIniciarSesion, devolverRegistrarse, conectarse } = require("../controllers/auth");

router.route("/iniciar-sesion").get(devolverIniciarSesion).post(conectarse);
router.route("/registrarse").get(devolverRegistrarse);

module.exports = router;
