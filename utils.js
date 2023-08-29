const jwt = require("jsonwebtoken");

const PRIVATE_KEY = "SECRET";
const PUBLIC_KEY = "PUBLIC_SECRET";

// sign JWT
function signJWT(payload, expiresIn) {
  return jwt.sign(payload, PRIVATE_KEY, { algorithm: "HS256", expiresIn });
}

// verify JWT
function verifyJWT(token) {
  try {
    const payload = jwt.verify(token, PRIVATE_KEY);
    return { payload, expired: false };
  } catch (error) {
    return { payload: null, expired: error.message.includes("jwt expired") };
  }
}

const userIds = {};
const io = {};
module.exports = { verifyJWT, signJWT, userIds, io };
