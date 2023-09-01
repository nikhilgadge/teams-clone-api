const Conversation = require("../model/Conversation");
const { userIds, io } = require("../utils");
const { createOrAddConversation } = require("./conversation");
//temporary stogare for {email => {socketId , status}}

const rooms = {};
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

  socket.on("join-room", ({ roomID, toEmail }) => {
    socket.join(roomID);
    socket.to(roomID).emit("user-joined", socket.id);

    if (toEmail) {
      socket
        .to(userIds[toEmail].socketId)
        .emit("incoming-call", { roomID, fromEmail: socket.user.email });
    }
  });

  socket.on("offer", (payload) => {
    globalIO.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    globalIO.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (incoming) => {
    globalIO.to(incoming.target).emit("ice-candidate", incoming.candidate);
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
