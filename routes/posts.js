const express = require("express");
const router = express.Router();

const subirImagen = require("../middleware/multer");

const crearPost = require("../controllers/posts");

router.route("/").post(subirImagen.single("imagenASubir"), crearPost);

module.exports = router;
