const mongoose = require("mongoose");
const { Schema } = mongoose;
const schema = new Schema({
  userId: { type: [{ type: mongoose.Types.ObjectId }] },
  type: { type: String, enum: ["private", "group"] },
});
const chatRoomModel = mongoose.model("chatRoom", schema);
module.exports = chatRoomModel;
