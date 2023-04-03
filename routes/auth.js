const express = require("express");
const router = express.Router();

const { devolverLogin, devolverSignup, hacerLogin } = require("../controllers/auth");

router.route("/login").get(devolverLogin).post(hacerLogin);
router.route("/signup").get(devolverSignup);

module.exports = router;
