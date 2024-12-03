const jwt = require("jsonwebtoken");

//  decode token

module.exports = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, process.env.jwt_secret, (err, decoded) => {
    try {
      if (err) {
        return res.status(401).send({
          message: "Auth failed",
          success: false,
        });
      } else {
        req.body.userId = decoded.userId;
        next();
      }
    } catch (error) {
      res.send({
        message: "authorization failed",
        success: false,
      });
    }
  });
};
