require("dotenv").config();

const localLogger = require("./localLogger");
const productionLogger = require("./productionLogger");

const nodeEnv = process.env.NODE_ENV;
let logger = null;
if (process.env.NODE_ENV !== "production") {
  logger = localLogger();
} else {
  logger = productionLogger();
}

module.exports = logger;
