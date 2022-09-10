const mongoose = require("mongoose");
const { Schema } = mongoose;
const schema = new Schema({
  roomId: { type: mongoose.Types.ObjectId },
  senderName: { type: String },
  message: { type: String },
});
const MessageModel = mongoose.model("messages", schema);
module.exports = MessageModel;
