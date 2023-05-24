const express = require("express");
const router = express.Router();

const { cargarImagen, subirImagenAS3 } = require("../middleware/multer");

const {
	crearPost,
	favoritearPost,
	desfavoritearPost,
	obtenerPostsTimeline,
	obtenerPostsUsuario,
} = require("../controllers/posts");

router.route("/").post(cargarImagen.single("imagenASubir"), subirImagenAS3, crearPost);
router.route("/cargarmasposts").post(obtenerPostsTimeline);
router.route("/:usuario/cargarmasposts").post(obtenerPostsUsuario);
router.route("/:idPost/desfav").patch(desfavoritearPost);
router.route("/:idPost/fav").patch(favoritearPost);

module.exports = router;
