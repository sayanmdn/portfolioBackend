const express = require("express");
const cors = require("cors");
const authRouter = require("./routes/auth");
const postRoute = require("./routes/private");
const dotenv = require("dotenv");
dotenv.config();
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
const port = 8080;

app.use("/user", authRouter);
app.use("/post", postRoute);

app.get("/", (req, res) => {
  console.log(JSON.stringify(req.body));
  res.send("Helcome! This is the portfolio backend v2");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
