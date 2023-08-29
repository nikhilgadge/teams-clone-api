const jwt = require("jsonwebtoken");
const { verifyJWT } = require("../utils");

async function checkJWT(req, res, next) {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) return res.sendStatus(401);

  const { payload, expired } = verifyJWT(accessToken);

  if (!payload) return res.sendStatus(403); //invalid or expired token

  req.user = payload;

  next();

  // jwt.verify(accessToken, "SECRET", (err, decoded) => {
  //   if (err) return res.sendStatus(403); //invalid token
  //   req.user = decoded;
  //   next();
  // });
}

module.exports = checkJWT;
