const mongoose = require("mongoose");
const { Schema } = mongoose;
const schema = new Schema({
  name: { type: String },
  password: { type: String },
});
const userModel = mongoose.model("user", schema);
module.exports = userModel;
