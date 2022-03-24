// Front-End 부분
// 여기서의 socket는 서버로의 연결을 뜻함
const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#name");
const messageForm = document.querySelector("#message");
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
  const msg = { type, payload };
  return JSON.stringify(msg);
}

// 아래 주석처리가 된 코드는 익명함수를 사용하지 않고 따로 function을 만들어 사용한 것이고
// 주석처리가 안된 현재 코드는 익명함수를 사용한것이다.
// function handleOpen() {
//     console.log("Connected to Server ✅");
// }

// socket.addEventListener("open", handleOpen)
socket.addEventListener("open", () => {
  console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
  // console.log("새 메세지: ", message.data, " 를 서버로 부터 받아왔습니다.");
  const li = document.createElement("li");
  li.innerText = message.data;
  messageList.append(li);
});

socket.addEventListener("close", () => {
  console.log("Disconnected from Server ❌");
});

// setTimeout(() => {
//   socket.send("hello from the browser!!");
// }, 6000);

function handleSubmit(event) {
  event.preventDefault();
  const input = messageForm.querySelector("input");
  socket.send(makeMessage("new_message", input.value));
  input.value = "";
}

function handleNickSubmit(event) {
  event.preventDefault();
  const input = nicknameForm.querySelector("input");
  socket.send(makeMessage("nickname", input.value));
  input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nicknameForm.addEventListener("submit", handleNickSubmit);
