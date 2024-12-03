const mongoose = require("mongoose");

mongoose.connect(process.env.mongo_url);

const connectionResult = mongoose.connection;

connectionResult.on("error", () => {
  console.log("error connecting to db");
});
connectionResult.on("connected", () => {
  console.log("connected to db");
});

module.exports = connectionResult;
