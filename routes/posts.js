const express = require("express");
const router = express.Router();

const { cargarImagen, subirImagenAS3 } = require("../middleware/multer");

const { crearPost, obtenerPosts } = require("../controllers/posts");

router.route("/posts").get(obtenerPosts);
router.route("/api/v1/posts").post(cargarImagen.single("imagenASubir"), subirImagenAS3, crearPost);

module.exports = router;
