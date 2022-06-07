const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 6,
  },
  email: {
    type: String,
    required: true,
    max: 128,
    min: 8,
  },
  password: {
    type: String,
    required: true,
    max: 128,
    min: 8,
  },
  time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
