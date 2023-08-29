const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const app = express();

const cors = require("cors");
const connectDB = require("./db/connect");
const authRoute = require("./routes/auth");
const otherRoute = require("./routes/other");
const cookieParser = require("cookie-parser");
const checkJWT = require("./middleware/checkJWT");
const requireUser = require("./middleware/requireUser");
const chatRoute = require("./routes/chat");
const checkSocketJWT = require("./middleware/checkSocketJWT");
const { onConnection } = require("./controller/socket");

// app.use(cors());

const server = createServer(app);

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://teams-clone-xmot.onrender.com", "http://localhost:3000"],
    credentials: true,
  })
);

//Routes
app.use("/api/auth/", authRoute);

// Middleware
app.use(checkJWT, requireUser);

app.use("/api/chat/", chatRoute);
app.use("/api/other/", otherRoute);

const PORT = 3001;
connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () =>
      console.log(`Server is listening on port ${PORT}`)
    );

    const io = new Server(server, {
      cors: {},
    });

    // checkJWT
    io.use(checkSocketJWT);

    io.on("connection", onConnection(io));
  })
  .catch((e) => console.log(e));
