const express = require("express");
const { home, admin, agent, coach } = require("../controller/other");
const requireUser = require("../middleware/requireUser");
const router = express.Router();

router.get("/home", requireUser, home);
router.get("/admin", requireUser, admin);
router.get("/agent", requireUser, agent);
router.get("/coach", requireUser, coach);

module.exports = router;
