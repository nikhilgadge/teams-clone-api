const express = require("express");
const { login, register, refreshToken, logout } = require("../controller/auth");
const requireUser = require("../middleware/requireUser");
const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/refreshToken", refreshToken);
router.get("/logout", logout);

module.exports = router;
