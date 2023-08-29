const requireUser = (req, res, next) => {
  if (!req.user) {
    return res
      .status(403)
      .json({ status: "error", message: "Invalid session" });
  }

  return next();
};

module.exports = requireUser;
