const Conversation = require("../model/Conversation");
const { userIds, io } = require("../utils");
const { createOrAddConversation } = require("./conversation");
//temporary stogare for {email => {socketId , status}}

const onConnection = (globalIO) => (socket) => {
  io.globalIo = globalIO;
  console.log(`User connected ${socket.user.email}`);

  userIds[socket.user.email] = {
    socketId: socket.id,
    status: "online",
  };

  socket.broadcast.emit("status-change", {
    email: socket.user.email,
    status: "online",
  });

  socket.on("message", onMessage(socket));

  socket.on("disconnect", onDisconnect(socket));

  socket.on("get-status", (email) => {
    io?.globalIO
      ?.to(userIds[socket.user.email]?.socketId)
      .emit("status-change", {
        email: email,
        status: userIds[email]?.status,
        lastSeen: userIds[email]?.lastSeen,
      });
  });

  // webrtc
  socket.on("initiate-call", (data, cb) => {
    const { roomId, emailId, offer } = data;

    // send offer to user requested email
    socket
      .to(userIds[emailId]?.socketId)
      .emit("incoming-call", { offer, fromEmail: socket.user.email, roomId });

    // call initiated
    cb();
  });

  socket.on("accept-call", (data) => {
    const { answer, roomId, toEmail } = data;

    // send answer to user requested email
    socket
      .to(userIds[toEmail]?.socketId)
      .emit("call-accepted", { answer, fromEmail: socket.user.email, roomId });
  });
};

const onMessage = (socket) => async (data) => {
  console.log("On Message");
  const { isNewConversation, tempId } = data;
  const result = await createOrAddConversation(data);

  if (result) {
    io?.globalIo
      ?.to([userIds[data.reciever]?.socketId, userIds[data.sender]?.socketId])
      .emit("recieve", {
        data: result,
        isNewConversation,
        tempId: isNewConversation ? tempId : "",
      });
  }
};
const onDisconnect = (socket) => async (reason) => {
  userIds[socket.user.email] = {
    socketId: socket.id,
    status: undefined,
    lastSeen: new Date(),
  };

  socket.broadcast.emit("status-change", {
    email: socket.user.email,
    status: undefined,
    lastSeen: new Date(),
  });
};

module.exports = { onConnection, userIds };
