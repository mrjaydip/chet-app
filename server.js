const express = require("express");
const app = express();
const http = require("http").createServer(app);
const PORT = process.env.PORT || 3000;
const io = require("socket.io")(http);

http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use(express.static(__dirname + "/public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Socket

let userArray = [];
io.on("connection", (socket) => {
  socket.on("join-user", (msg) => {
    socket.join(msg.room);
    userArray.push({ id: socket.id, name: msg.user, room: msg.room });
    socket.to(msg.room).emit("join-user", msg, userArray);
  });

  socket.on("message", (msg) => {
    socket.to(msg.room).emit("message", msg);
  });

  socket.on("disconnect", () => {
    if (userArray.length > 0) {
      let userGet = userArray
        .map((e, index, arr) => {
          if (e.id === socket.id) {
            return { e: e, index: index };
          }
        })
        .filter((e) => e !== undefined);

      userArray.splice(userGet[0].index, 1);

      let msg = {
        user: userGet[0].e.name,
        message: `${userGet[0].e.name} Dis-Connected SuccessFully...!`,
        room: userGet[0].e.room,
      };

      socket.to(userGet[0].e.room).emit("disConnect-user", msg);
    }
  });

  socket.on("disconnect-user", (message) => {
    let userGet = userArray
      .map((e, index) => {
        if (e.name === message.user) {
          return { e: e, index: index };
        }
      })
      .filter((e) => e !== undefined);

    userArray.splice(userGet[0].index, 1);

    let msg = {
      user: userGet[0].e.name,
      message: `${userGet[0].e.name} Dis-Connected SuccessFully...!`,
      room: userGet[0].e.room,
    };

    socket.to(userGet[0].e.room).emit("disConnect-user", msg);
  });
});
