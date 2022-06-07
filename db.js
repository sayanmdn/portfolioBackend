const username = process.env.MONGO_USERNAME;
const mongo_password = process.env.MONGO_PASSWORD;

const logger = require("./logger");

const mongoose = require("mongoose");

var uri =
  "mongodb+srv://" +
  username +
  ":" +
  mongo_password +
  "@cluster0.9l02g.gcp.mongodb.net/portfolio-db?retryWrites=true&w=majority";

try {
  mongoose.connect(
    uri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    () => logger.info("Connected")
  );
} catch (error) {
  logger.info("Could not connect");
  logger.info(error);
}
const connection = mongoose.connection;
connection.once("open", function () {
  logger.info("MongoDB database connection established successfully");
});
