const home = async (req, res) => {
  res.json({ status: "ok", message: "Hello home" });
};

const agent = async (req, res) => {
  res.json({ status: "ok", message: "Hello home" });
};
const coach = async (req, res) => {
  res.json({ status: "ok", message: "Hello home" });
};
const admin = async (req, res) => {
  res.json({
    status: "ok",
    message: "Hello admin" + new Date().getMilliseconds(),
  });
};

module.exports = { home, admin, coach, agent };
