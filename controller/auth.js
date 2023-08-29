const User = require("../model/User");
const bcrypt = require("bcrypt");
const { signJWT, verifyJWT } = require("../utils");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  const user = await User.findOne({
    email: req.body.email,
  }).exec();

  if (!user) {
    return res.status(401).json({
      status: "error",
      message: "Email does not exist",
    });
  }

  const passCheck = await bcrypt.compare(req.body.password, user.password);

  if (!passCheck) {
    return res.status(401).json({
      status: "error",
      message: "Please check your password",
    });
  }

  // create access token
  // dont set sensitive info in payload
  const accessToken = signJWT({ name: user.name, email: user.email }, "10m");
  const refreshToken = signJWT({ email: user.email }, "1h");

  // delete refresh-token if attached in cookie from db during login
  let filteredTokens = req.cookies?.refreshToken
    ? user.refreshToken.filter((rt) => rt !== req.cookies?.refreshToken)
    : user.refreshToken;

  if (req.cookies?.refreshToken) {
    // during login if user have token , means it must be unused and still avaliable in db
    // but if we didn't find the token in db it must be stolen so we need to clear all the tokens for that user
    /* 
      Scenario added here: 
          1) User logs in but never uses RT and does not logout 
          2) RT is stolen
          3) If 1 & 2, reuse detection is needed to clear all RTs when user logs in
      */
    const refreshToken = req.cookies?.refreshToken;
    const foundToken = await User.findOne({ refreshToken }).exec();

    // Detected refresh token reuse!
    if (!foundToken) {
      // clear out ALL previous refresh tokens
      newRefreshTokenArray = [];
    }

    res.clearCookie("refreshToken", { httpOnly: true });
  }

  // save/push refresh token
  user.refreshToken = [...filteredTokens, refreshToken];
  await user.save();

  // set access token in cookie
  res.cookie("accessToken", accessToken, {
    maxAge: 300000, //5min
    httpOnly: true,
  });

  res.cookie("refreshToken", refreshToken, {
    maxAge: 3.154e10, //1year
    httpOnly: true,
  });

  res.status(200).json({
    status: "ok",
    user: { name: user.name, email: user.email },

    message: "Login sucessfully",
    accessToken,
  });
};

const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res
      .status(400)
      .json({ message: "email , name and password are required." });

  // check for duplicate usernames in the db
  const duplicate = await User.findOne({ email: email }).exec();
  if (duplicate) return res.sendStatus(409); //Conflict

  try {
    //encrypt the password
    const hashedPwd = await bcrypt.hash(password, 10);

    //create and store the new user
    const result = await User.create({
      name,
      email,
      password: hashedPwd,
    });

    res.status(201).json({ status: "ok", message: "New user created!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  // On client, also delete the accessToken

  const cookies = req.cookies;
  if (!cookies?.refreshToken) return res.sendStatus(204); //No content

  const refreshToken = cookies.refreshToken;

  // Is refreshToken in db?
  const foundUser = await User.findOne({ refreshToken }).exec();
  if (!foundUser) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
    });
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  const filteredTokenArray = foundUser.refreshToken.filter(
    (rt) => rt !== refreshToken
  );
  foundUser.refreshToken = [...filteredTokenArray];
  const result = await foundUser.save();

  console.log(result);

  res.cookie("accessToken", "", {
    maxAge: "0",
    httpOnly: true,
  });
  res.cookie("refreshToken", "", {
    maxAge: "0",
    httpOnly: true,
  });
  res.sendStatus(204);
};

const refreshToken = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.refreshToken) return res.sendStatus(401);
  const refreshToken = cookies.refreshToken;

  // clear the cookie after extracting data from it
  res.clearCookie("refreshToken", { httpOnly: true });

  const foundUser = await User.findOne({ refreshToken }).exec();

  // Detected refresh token reuse!
  // remove the refresh access token of the user mentioned in user proided token
  if (!foundUser) {
    const { payload } = verifyJWT(refreshToken);

    if (!payload) {
      return res.sendStatus(403); //Forbidden
    }

    // Delete refresh tokens of hacked user
    const hackedUser = await User.findOne({
      email: payload.email,
    }).exec();

    if (hackedUser) {
      hackedUser.refreshToken = [];
      const result = await hackedUser.save();
    }
    return res.sendStatus(403); //Forbidden
  }

  // remove old refresh token fron db
  const newRefreshTokenArray = foundUser.refreshToken.filter(
    (token) => token !== refreshToken
  );

  // evaluate jwt
  jwt.verify(refreshToken, "SECRET", async (err, decoded) => {
    if (err) {
      // expired refresh token
      foundUser.refreshToken = [...newRefreshTokenArray];
      const result = await foundUser.save();
    }
    if (err || foundUser.email !== decoded.email) return res.sendStatus(403);

    // Refresh token was still valid
    const accessToken = signJWT(
      { name: foundUser.name, email: foundUser.email },
      "10m"
    );

    const newRefreshToken = signJWT({ email: foundUser.email }, "1h");

    // Saving refreshToken with current user
    foundUser.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    const result = await foundUser.save();

    // Creates Secure Cookie with refresh token & access token
    res.cookie("accessToken", accessToken, {
      maxAge: 300000, //5min
      httpOnly: true,
    });

    res.cookie("refreshToken", newRefreshToken, {
      maxAge: 3.154e10, //1year
      httpOnly: true,
    });

    res.json({
      accessToken,
      status: "ok",
      user: { name: foundUser.name, email: foundUser.email },
    });
  });
};
module.exports = { login, register, refreshToken, logout };
