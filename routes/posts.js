const express = require("express");
const router = express.Router();

const { obtenerPostsPorTag } = require("../controllers/posts");

router.route("/posts").get(obtenerPostsPorTag).post(obtenerPostsPorTag);

module.exports = router;
