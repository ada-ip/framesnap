const express = require("express");
const router = express.Router();

const { cargarImagen, subirImagenAS3 } = require("../middleware/multer");

const { crearPost, obtenerPosts, favoritearPost, desfavoritearPost } = require("../controllers/posts");

router.route("/posts").get(obtenerPosts);
router.route("/api/v1/posts").post(cargarImagen.single("imagenASubir"), subirImagenAS3, crearPost);
router.route("/api/v1/posts/:idPost/desfav").patch(desfavoritearPost);
router.route("/api/v1/posts/:idPost/fav").patch(favoritearPost);

module.exports = router;
