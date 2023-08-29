const Conversation = require("../model/Conversation");
const fs = require("fs");
const path = require("path");
const { userIds, io } = require("../utils");

const createOrAddConversation = async (data) => {
  try {
    const { sender, reciever, conversationId, message, type = "String" } = data;
    const newMessage = {
      authorEmail: sender,
      body: message,
      time: new Date(),
      type,
    };

    if (!conversationId) {
      // create new conversation
      const conversation = await Conversation.create({
        members: [sender, ...reciever],
        messages: [newMessage],
      });

      return conversation;
    }

    //   add to existing conversation
    const conversation = await Conversation.findOne({ _id: conversationId });

    conversation.messages.push(newMessage);

    await conversation.save();

    return conversation;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getConversations = async (req, res) => {
  const { email } = req.user;
  if (!email)
    return res
      .status(400)
      .json({ status: "error", message: "Email is required" });

  const conversations = await Conversation.find({ members: email });

  let members = [email];
  conversations?.forEach((conversation) => {
    members = [...members, ...conversation.members];
  });

  console.log(userIds);
  const uniqueMembers = [...new Set(members)];

  const memberStatus = uniqueMembers.map((member) => {
    return {
      email: member,
      status: userIds[member]?.status,
      lastSeen: userIds[member]?.lastSeen,
    };
  });
  console.log(memberStatus);

  res.status(200).json({ conversations, memberStatus });
};

const getValue = (disposition, regex) => {
  if (disposition && disposition.indexOf("attachment") !== -1) {
    const matches = regex.exec(disposition);

    if (matches != null && matches[1]) {
      return matches[1].replace(/['"]/g, "");
    }
    return "";
  }
};
const uploadFile = (req, res) => {
  try {
    const disposition = req.headers["content-disposition"];
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const filename = getValue(disposition, filenameRegex);

    const senderRegex = /sender[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const sender = getValue(disposition, senderRegex);

    const recieverRegex = /reciever[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const reciever = getValue(disposition, recieverRegex);

    const conversationIdRegex = /conversationId[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const conversationId = getValue(disposition, conversationIdRegex);

    const tempIdRegex = /tempId[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const tempId = getValue(disposition, tempIdRegex);

    const filePath = path.join("upload", filename);
    const fileWriteStream = fs.createWriteStream(filePath);
    req.pipe(fileWriteStream);

    req.on("end", async () => {
      // save link to mongodb
      // emit to reciever
      // io.to(userIds[sender]?.socketId).emit("upload-success", {});

      const result = await createOrAddConversation({
        sender,
        reciever: [reciever],
        conversationId,
        message: filename,
        type: "File",
      });

      if (result) {
        io?.globalIo
          ?.to([userIds[reciever]?.socketId, userIds[sender]?.socketId])
          .emit("recieve", {
            data: result,
            isNewConversation: !conversationId ? true : false,
            tempId: !conversationId ? tempId : "",
          });
      }

      console.log("File upload complete");
      res.status(200).json({ status: "ok" });
    });
  } catch (error) {
    res.status(400).json({ status: "error" });
  }
};

const download = (req, res) => {
  const { filename } = req.query;
  const filePath = path.join("upload", filename);
  res.download(
    filePath,
    filename, // Remember to include file extension
    (err) => {
      if (err) {
        res.send({
          error: err,
          msg: "Problem downloading the file",
        });
      }
    }
  );
};

module.exports = {
  createOrAddConversation,
  getConversations,
  uploadFile,
  download,
};
