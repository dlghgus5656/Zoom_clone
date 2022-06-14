// Front-End 부분
const socket = io(); // 프론트에서 백으로 연결

const myFace = document.getElementById("myFace");

const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");

const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

// 연결된 장비의 이름을 보여주고 옵션을 줘 선택할 수 있게한다.
async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label == camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  // deviceID가 없을 때 실행 됨
  const initialConstraints = {
    audio: true,
    video: { facingMode: "user" },
  };
  // deviceID가 있을 때 실행 됨
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      // deviceID가 있을 때 처음 cameraConstraints 실행 없을 때 뒤에 initialConstraints 실행
      deviceId ? cameraConstraints : initialConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    //에러가 생기면 에러를 출력한다.
    console.log(e);
  }
}
// getMedia();

function handleMuteClick() {
  // 실제 끄고 키는 기능
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (!muted) {
    muteBtn.innerText = "소리 키기";
    muted = true;
  } else {
    muteBtn.innerText = "음소거";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));

  if (cameraOff) {
    cameraBtn.innerText = "카메라 끄기";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "카메라 켜기";
    cameraOff = true;
  }
}

async function handelCameraChange() {
  await getMedia(camerasSelect.value);
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === "video");
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handelCameraChange);

// Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code
// Signaling process: 서버에 브라우저 정보(offer)를 주고 그 정보로 브라우저는 서버를 필요로 하지 않는 peer to peer 연결이 가능해진다.
// peer A 에서 돌아가는 코드
socket.on("welcome", async () => {
  // DataChannel 생성
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("massage", (event) => console.log(event.data));
  console.log("데이터 채널 생성");
  const offer = await myPeerConnection.createOffer();
  //offer(초대장 개념) peer A가 생성 후 peer B에게 전달
  myPeerConnection.setLocalDescription(offer);
  console.log("offer 전송");
  socket.emit("offer", offer, roomName);
});
//peer B 에서 돌아가는 코드
socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", (event) =>
      console.log(event.data)
    );
  });
  console.log("offer 수신");
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("answer 전송");
});

socket.on("answer", (answer) => {
  console.log("answer 수신됨");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  console.log("candidate 수신됨");
  myPeerConnection.addIceCandidate(ice);
});

// webRTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
  console.log("candidate 전송");
  socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
  const peerFace = document.getElementById("peerFace");
  // console.log("내 peer로 부터 이벤트를 받음");
  peerFace.srcObject = data.stream;
}
//
//
//
//
//

//socketIO로 한 부분
// const room = document.getElementById("room");
// room.hidden = true;

// let roomName;

// function addMessage(message) {
//   const ul = room.querySelector("ul");
//   const li = document.createElement("li");
//   li.innerText = message;
//   ul.appendChild(li);
// }

// function handleMessageSubmit(event) {
//   event.preventDefault();
//   const input = room.querySelector("#msg input");
//   const value = input.value;
//   // 백엔드로 new_message라는 이벤트를 보냄 첫 번째 argument input.value와 두 번째론 백엔드에서 시작시킬 수 있는 function을 넣어서 보냄
//   socket.emit("new_message", input.value, roomName, () => {
//     addMessage(`You: ${value}`);
//   });
//   input.value = "";
// }

// function handleNicknameSubmit(event) {
//   event.preventDefault();
//   const input = room.querySelector("#name input");
//   socket.emit("nickname", input.value);
// }

// function showRoom() {
//   welcome.hidden = true;
//   room.hidden = false;
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName}`;
//   const msgForm = room.querySelector("#msg");
//   const nameForm = room.querySelector("#name");
//   msgForm.addEventListener("submit", handleMessageSubmit);
//   nameForm.addEventListener("submit", handleNicknameSubmit);
// }

// // socketIO는 WebSocket처럼 오브젝트를 스트링으로 변환하는 등에 작업을 해줄 필요 없다.
// function handleRoomSubmit(event) {
//   event.preventDefault(); // 이벤트 고유기능 새로고침 등 막기
//   const input = form.querySelector("input");
//   socket.emit("enter_room", input.value, showRoom);
//   roomName = input.value;
//   //서버에서 done function을 실행 시키지만 실행 되는건 여기 프론트단에 있는 function이 실행 된다.
//   // socketIO 1. 특정한 event를 emit해 줄 수 있다. 이름 상관없이, 2. object를 전송할 수 있다.(string만 전송 할 필요 없음)
//   input.value = "";
// }

// form.addEventListener("submit", handleRoomSubmit);

// socket.on("welcome", (user, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${user} 이 방에 참가하였습니다!`);
// });

// socket.on("bye", (left, newCount) => {
//   const h3 = room.querySelector("h3");
//   h3.innerText = `Room ${roomName} (${newCount})`;
//   addMessage(`${left} 이 퇴장하였습니다ㅠㅠ`);
// });
// // addMessage만 쓰는것이 socket.on("new_message", (msg) => {addMessage(msg)}); 와 같다.
// socket.on("new_message", addMessage);

// //방 목록
// socket.on("room_change", (rooms) => {
//   const roomList = welcome.querySelector("ul");
//   roomList.innerHTML = "";
//   if (rooms.length === 0) {
//     return;
//   }
//   rooms.forEach((room) => {
//     const li = document.createElement("li");
//     li.innerText = room;
//     roomList.append(li);
//   });
// });
//
//
//
//
//
//
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
