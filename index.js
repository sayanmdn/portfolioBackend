const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const cors = require("cors");
const authRouter = require("./routes/auth");
const postRoute = require("./routes/private");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./db");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/user", authRouter);
app.use("/post", postRoute);

app.get("/", (req, res) => {
  console.log(JSON.stringify(req.body));
  res.send("Helcome! This is the portfolio backend v2");
});

module.exports.handler = serverless(app);
