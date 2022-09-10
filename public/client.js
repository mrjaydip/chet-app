const socket = io();
let userName,
  password,
  room,
  typing = false;
let msg = {
  user: "",
  message: ``,
  room: "",
  currentUsers: "",
};
let textarea = document.querySelector("#textarea");
let typingClass = document.querySelector(".typing");
let user = document.querySelector("#user");
let mainDivS = document.querySelector(".main-div");
let messageArea = document.querySelector(".message__area");
let currentUsers;

do {
  userName = prompt("Please enter your userName: ");
} while (!userName);
do {
  password = prompt("Please enter your password: ");
} while (!password);

user.innerText = userName;

//User Create Chat
function createUser() {
  let userData = {
    name: userName,
    password,
  };
  socket.emit("create-user", userData);
  socket.on("userList-get", (allUserList) => {
    console.log("allUserList", allUserList);
  });
  socket.on("currentUser-get", (curUser) => {
    currentUsers = curUser;
  });
}
createUser();

//user Join ChatRoom
function users(id) {
  msg = {
    user: userName,
    message: `${userName} Connected SuccessFully...!`,
    room: id,
    currentUsers,
  };
  socket.emit("disconnect-user", msg);
  socket.emit("join-user", msg, "private");
}

//user join groupChatRoom
function groups(id) {
  msg = {
    user: userName,
    message: `${userName} Connected SuccessFully...!`,
    room: id,
    currentUsers,
  };
  socket.emit("disconnect-user", msg);
  socket.emit("join-group", msg);
}

// ----Send Message Functions------
function save(e) {
  sendMessage(e);
}

textarea.addEventListener("keyup", (e) => {
  if (e.target.value.length !== 0) {
    typing = true;
    socket.emit("typing-status", { msg, typing });
    setTimeout(setTimeOutForTyping, 2000);
  }
  if (e.key === "Enter") {
    sendMessage(e.target.value);
  }
});

function setTimeOutForTyping() {
  typing = false;
  socket.emit("typing-status", { msg, typing });
}

function sendMessage(message) {
  msg = {
    ...msg,
    message: message.trim(),
  };
  // Append
  appendMessage({ ...msg, user: "You" }, "outgoing");
  textarea.value = "";
  scrollToBottom();

  // Send to server
  socket.emit("message", msg);
}

// ----Print Message In ChatBox Functions------
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

// Receive User Join Message
socket.on("join-user", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

// Receive messages
socket.on("message", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

// Print All Message
socket.on("old-message-print", (message) => {
  messageArea.innerHTML = "";
  message.forEach((element) => {
    if (element.senderName === msg.user) {
      appendMessage({ user: "You", message: element.message }, "outgoing");
      scrollToBottom();
    } else {
      appendMessage(
        { user: element.senderName, message: element.message },
        "incoming"
      );
      scrollToBottom();
    }
  });
});

//typing status print
socket.on("typing-status", (typing) => {
  typing === true && (typingClass.innerText = "Typing...");
  typing === false && (typingClass.innerText = "");
});

// user DisConnect Message
socket.on("disConnect-user", (msg) => {
  appendMessage(msg, "incoming");
  scrollToBottom();
});

function scrollToBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}
