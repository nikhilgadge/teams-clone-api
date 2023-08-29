const express = require("express");
const {
  getConversations,
  uploadFile,
  download,
} = require("../controller/conversation");
const router = express.Router();

// router.post("/createOrAddConversation", createOrAddConversation);
router.get("/getConversations", getConversations);
router.post("/uploadFile", uploadFile);
router.get("/download", download);

module.exports = router;
