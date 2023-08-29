const { verifyJWT } = require("../utils");

const checkSocketJWT = (socket, next) => {
  const accessToken = socket.handshake?.auth?.token;

  if (!accessToken) return next(new Error("No access token found"));

  const { payload, expired } = verifyJWT(accessToken);

  if (!payload) return next(new Error("Expired access token")); //invalid or expired token

  socket.user = payload;

  next();
};
module.exports = checkSocketJWT;
