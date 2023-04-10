const express = require("express");
const router = express.Router();

const { cargarImagen, subirImagenAS3 } = require("../middleware/multer");

const crearPost = require("../controllers/posts");

router.route("/").post(cargarImagen.single("imagenASubir"), subirImagenAS3, crearPost);

module.exports = router;
