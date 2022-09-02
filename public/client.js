const socket = io();
let userName,
  room,
  userArr = [];

let textarea = document.querySelector("#textarea");
let user = document.querySelector("#user");
let messageArea = document.querySelector(".message__area");
let roomArr = ["One", "Two", "Three", "Four"];
do {
  userName = prompt("Please enter your userName: ");
} while (!userName);

user.innerText = userName;
// do {
//   room = prompt("Please enter your room: ");
// } while (!room);

// function joinUser() {
//   let msg = {
//     user: userName,
//     message: `${userName} Connected SuccessFully...!`,
//     room: room,
//   };
//   socket.emit("join-user", msg);
// }

function users(id) {
  room = roomArr[id - 1];
  function joinUser() {
    let msg = {
      user: userName,
      message: `${userName} Connected SuccessFully...!`,
      room: room,
    };
    let isExitsUser = userArr.find((e) => e.name === userName);
    isExitsUser !== undefined && socket.emit("disconnect-user", msg);

    socket.emit("join-user", msg);
  }
  joinUser();
}

function save(e) {
  sendMessage(e);
}

textarea.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    sendMessage(e.target.value);
  }
});

function sendMessage(message) {
  let msg = {
    user: userName,
    message: message.trim(),
    room: room,
  };
  // Append
  appendMessage(msg, "outgoing");
  textarea.value = "";
  scrollToBottom();

  // Send to server
  socket.emit("message", msg);
}

function appendMessage(msg, type) {
  let mainDiv = document.createElement("div");
  let className = type;
  mainDiv.classList.add(className, "message");

  let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
  mainDiv.innerHTML = markup;
  messageArea.appendChild(mainDiv);
}

// Receive messages
socket.on("message", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

socket.on("join-user", (msg, userArray) => {
  userArr = userArray;
  appendMessage(msg, "incoming");
  scrollToBottom();
});

socket.on("disConnect-user", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

function scrollToBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}
