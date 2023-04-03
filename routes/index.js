const express = require("express");
const router = express.Router();

const devolverIndex = require("../controllers/index");

router.route("/").get(devolverIndex);

module.exports = router;
