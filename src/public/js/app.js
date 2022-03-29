// // Front-End 부분
const socket = io(); // 프론트에서 백으로 연결

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

const room = document.getElementById("room");
room.hidden = true;

let roomName;

function addMessage(message) {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = message;
  ul.appendChild(li);
}

function showRoom() {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
}

// socketIO는 WebSocket처럼 오브젝트를 스트링으로 변환하는 등에 작업을 해줄 필요 없다.
function handleRoomSubmit(event) {
  event.preventDefault(); // 이벤트 고유기능 새로고침 등 막기
  const input = form.querySelector("input");
  socket.emit("enter_room", input.value, showRoom);
  roomName = input.value;
  //서버에서 done function을 실행 시키지만 실행 되는건 여기 프론트단에 있는 function이 실행 된다.
  // socketIO 1. 특정한 event를 emit해 줄 수 있다. 이름 상관없이, 2. object를 전송할 수 있다.(string만 전송 할 필요 없음)
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", () => {
  addMessage("누군가 방에 참가하였습니다!");
});

// webSocket로 한 부분
// // 여기서의 socket는 서버로의 연결을 뜻함
// const messageList = document.querySelector("ul");
// const nicknameForm = document.querySelector("#name");
// const messageForm = document.querySelector("#message");
// const socket = new WebSocket(`ws://${window.location.host}`);

// function makeMessage(type, payload) {
//   const msg = { type, payload };
//   return JSON.stringify(msg);
// }

// // 아래 주석처리가 된 코드는 익명함수를 사용하지 않고 따로 function을 만들어 사용한 것이고
// // 주석처리가 안된 현재 코드는 익명함수를 사용한것이다.
// // function handleOpen() {
// //     console.log("Connected to Server ✅");
// // }

// // socket.addEventListener("open", handleOpen)
// socket.addEventListener("open", () => {
//   console.log("Connected to Server ✅");
// });

// socket.addEventListener("message", (message) => {
//   // console.log("새 메세지: ", message.data, " 를 서버로 부터 받아왔습니다.");
//   const li = document.createElement("li");
//   li.innerText = message.data;
//   messageList.append(li);
// });

// socket.addEventListener("close", () => {
//   console.log("Disconnected from Server ❌");
// });

// // setTimeout(() => {
// //   socket.send("hello from the browser!!");
// // }, 6000);

// function handleSubmit(event) {
//   event.preventDefault();
//   const input = messageForm.querySelector("input");
//   socket.send(makeMessage("new_message", input.value));
//   input.value = "";
// }

// function handleNickSubmit(event) {
//   event.preventDefault();
//   const input = nicknameForm.querySelector("input");
//   socket.send(makeMessage("nickname", input.value));
//   input.value = "";
// }

// messageForm.addEventListener("submit", handleSubmit);
// nicknameForm.addEventListener("submit", handleNickSubmit);
