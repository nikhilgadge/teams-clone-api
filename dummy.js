const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);

const cors = require("cors");

const io = new Server(server, {
  cors: {
    origin: "https://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // send a message to the client
  socket.emit("hello from server", 1, "2", { 3: Buffer.from([4]) });
  console.log("New Connection");

  // receive a message from the client
  socket.on("hello from client", (...args) => {
    // ...

    console.log("dwdw");
  });
});

server.listen("3002", () => console.log("Listening on port 3002"));
