const mongoose = require("mongoose");
const User = require("./User");

const MessageSchema = new mongoose.Schema({
  authorEmail: { type: String, required: [true] },
  body: { type: String, required: [true] },
  time: { type: Date, default: new Date() },
  type: { type: String, default: "String" },
});

const ConversationSchema = new mongoose.Schema({
  members: { type: [String], required: [true] },
  messages: { type: [MessageSchema], required: [true] },
  lastUpdate: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Conversation", ConversationSchema);
