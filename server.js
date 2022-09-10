const express = require("express");
const { default: mongoose } = require("mongoose");
const chatRoomModel = require("./model/chatRoomModel");
const MessageModel = require("./model/messageModel");
const app = express();
require("dotenv").config();
const userModel = require("./model/userModel");
const http = require("http").createServer(app);
const PORT = process.env.PORT || 3000;
require("./db/connection");

const io = require("socket.io")(http);

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Socket
let userArray = [];
io.on("connection", async (socket) => {
  socket.on("create-user", async (msg) => {
    const allUserListGet = await userModel.find({});
    let checkExitsUser = await userModel.findOne({
      name: msg.name,
      password: msg.password,
    });
    if (checkExitsUser === null) {
      const addNewUser = new userModel({
        name: msg.name,
        password: msg.password,
      });
      await addNewUser.save();
      socket.emit("currentUser-get", addNewUser._id);
      socket.emit("userList-get", allUserListGet);
    } else {
      socket.emit("currentUser-get", checkExitsUser._id);
      socket.emit("userList-get", allUserListGet);
    }
  });

  socket.on("join-user", async (msg, types) => {
    let isExitsRoomOrNot = await getExitsRoomId(msg, types);

    if (isExitsRoomOrNot.length !== 0) {
      socket.join(isExitsRoomOrNot[0]._id);

      userArray.push({
        user: msg.user,
        socketId: socket.id,
        userId: msg.currentUsers,
        otherUserId: msg.room,
        roomId: isExitsRoomOrNot[0]._id,
      });
      const findMessages = await MessageModel.find({
        roomId: mongoose.Types.ObjectId(isExitsRoomOrNot[0]._id),
      });

      socket.emit("old-message-print", findMessages);

      socket.to(isExitsRoomOrNot[0]._id).emit("join-user", msg);
    } else {
      const createRoom = new chatRoomModel({
        userId: [
          mongoose.Types.ObjectId(msg.room),
          mongoose.Types.ObjectId(msg.currentUsers),
        ],
        type: "private",
      });
      await createRoom.save();

      socket.join(createRoom._id);

      userArray.push({
        user: msg.user,
        socketId: socket.id,
        userId: msg.currentUsers,
        otherUserId: msg.room,
        roomId: createRoom._id,
      });

      const findMessages = await MessageModel.find({
        roomId: mongoose.Types.ObjectId(createRoom._id),
      });

      socket.emit("old-message-print", findMessages);

      socket.to(createRoom._id).emit("join-user", msg);
    }
  });

  socket.on("join-group", async (msg) => {
    const isExitUserInGroup = await chatRoomModel.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(msg.room),
          userId: {
            $in: [mongoose.Types.ObjectId(msg.currentUsers)],
          },
        },
      },
    ]);

    isExitUserInGroup.length === 0 &&
      (await chatRoomModel.findByIdAndUpdate(
        { _id: msg.room },
        {
          $push: {
            userId: msg.currentUsers,
          },
        }
      ));

    socket.join(msg.room);

    userArray.push({
      user: msg.user,
      socketId: socket.id,
      userId: msg.currentUsers,
      roomId: msg.room,
    });

    const findMessages = await MessageModel.find({
      roomId: mongoose.Types.ObjectId(msg.room),
    });

    socket.emit("old-message-print", findMessages);

    socket.to(msg.room).emit("join-user", msg);
  });

  socket.on("message", async (msg) => {
    let isExitsRoomOrNot = await getExitsRoomId(msg, "private");

    let storeMessage = new MessageModel({
      roomId: isExitsRoomOrNot[0]?._id || msg.room,
      senderName: msg.user,
      message: msg.message,
    });
    storeMessage.save();

    isExitsRoomOrNot[0]?._id !== undefined
      ? socket.to(isExitsRoomOrNot[0]?._id).emit("message", msg)
      : socket.to(msg.room).emit("message", msg);
  });

  socket.on("typing-status", async (msg) => {
    let isExitsRoomOrNot = await getExitsRoomId(msg.msg, "private");
    isExitsRoomOrNot[0]?._id !== undefined
      ? socket.to(isExitsRoomOrNot[0]?._id).emit("typing-status", msg.typing)
      : socket.to(msg.msg.room).emit("typing-status", msg.typing);
  });

  socket.on("disconnect", () => {
    let getDisConnectData = disConnectCheck(userArray, socket.id);
    if (getDisConnectData.isValid) {
      socket
        .to(getDisConnectData.roomId)
        .emit("disConnect-user", getDisConnectData.msg);
    }
  });

  socket.on("disconnect-user", (msg) => {
    let getDisConnectData = disConnectCheck(userArray, socket.id);
    if (getDisConnectData.isValid) {
      socket
        .to(getDisConnectData.roomId)
        .emit("disConnect-user", getDisConnectData.msg);
      socket.leave(getDisConnectData.roomId);
    }
  });
});

const getExitsRoomId = async (msg, types) => {
  return await chatRoomModel.aggregate([
    {
      $match: {
        $and: [
          {
            userId: new mongoose.Types.ObjectId(msg.room),
          },
          {
            userId: new mongoose.Types.ObjectId(msg.currentUsers),
          },
          {
            type: types,
          },
        ],
      },
    },
  ]);
};

const disConnectCheck = (userArray, socketId) => {
  if (userArray.length > 0) {
    let userGet = userArray
      .map((e, index) => {
        if (e.socketId === socketId) {
          return { e: e, index: index };
        }
      })
      .filter((e) => e !== undefined);

    if (userGet[0] !== undefined) {
      userArray.splice(userGet[0].index, 1);
      let msg = {
        user: userGet[0].e.user,
        message: `${userGet[0].e.user} Dis-Connected SuccessFully...!`,
        room: userGet[0].e.roomId,
      };
      return { isValid: true, msg, roomId: userGet[0].e.roomId };
    }
  }
  return { isValid: false };
};

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
