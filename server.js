const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5400;

const dbConfig = require("./config/dbConfig");
const usersRoute = require("./routes/usersRoute");
const transactionsRoute = require("./routes/transactionsRoute");
const requestsRoute = require("./routes/requestsRoute");

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use("/api/users", usersRoute);
app.use("/api/transactions", transactionsRoute);
app.use("/api/requests", requestsRoute);

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
