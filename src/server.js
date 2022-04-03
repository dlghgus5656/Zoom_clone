// Back-End 부분
import express from "express";
import http from "http";
// import WebSocket, { WebSocketServer } from "ws";
import { Server, Socket } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

// 같은 서버에서 http, webSocket 둘 다 작동시키는 준비(꼭 둘다 작동 시켜야하는것은 아니다, 웹소켓서버만 작동해도 상관없음)
// 여기선 두 서버가 같은 포트에 있으면해서 이렇게 함
// 서버를 만들고(보이게 노출시키고) 그 다음 http서버 위에 ws서버를 만들기 위함
//  http서버가 필요한 이유는 views, static files, home, redirection 를 사용하기 위함
// const server = http.createServer(app);
// const wss = new WebSocketServer({ server });

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer, {
  cors: {
    //아래 url은 데모용 url이므로 실제 사용할땐 서버url을 넣어주면 된다.
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
// 아래 부분에서 패스워드도 설정해줄 수 있다.
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  //const { rooms, sids } = wsServer.sockets.adapter;
  //위 코드 처럼도 쓸 수 있고
  // const sids = wsServer.sockets.adapter.sids;
  // const rooms = wsServer.sockets.adapter.rooms;
  // 위 두줄의 코드를 아래처럼 한줄로 바꿀 수 있다.
  // const {sockets: {adapter: { sids, rooms },},} = wsServer;}
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    // sids에서 키를 가져와 그 값이 undefined면 publicRooms이므로 방 이름인 key값을 push해준다.
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}
// 방안에 사용자 수 나타내기
function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// 프론트에서 백으로 연결
wsServer.on("connection", (socket) => {
  socket["nickname"] = "알수없음";
  socket.onAny((event) => {
    console.log(`Socket Event: ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    // console.log(socket.id);
    // console.log(socket.rooms);
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
    // console.log(socket.rooms);
    // setTimeout(() => {
    //   done("hello from the backend");
    // }, 10000);
  });
  // 방에서 나갈때 방에있는 모든 사람에게 퇴장 인사 보내기
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });

  // argument중 세 번째 done은 백엔드에서 실행시키는 것이 아니라 백에서 done를 호출하면 프론트에서 실행시킨다.
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

// function handleConnection(socket) {
//   console.log(socket);
// }

// 아래 주석처리가 된 코드는 익명함수를 사용한 것이고
// 주석처리가 안된 현재 코드는 익명함수를 사용하지 않고 따로 function을 만들어 사용한 것이다.

function onSocketClose() {
  console.log("Disconnected from Browser ❌");
}
// function onSocketMessage(message) {
//   console.log(message.toString("utf8"));
// }
// 연결된 브라우저를 저장해둠
// const sockets = [];

// // 여기서의 socket은 연결된 브라우저를 뜻함
// wss.on("connection", (socket) => {
//   sockets.push(socket);
//   socket["nickname"] = "알수없음";
//   console.log("Connected to Browser ✅");
//   // browser를 닫으면 close 이벤트 발생
//   socket.on("close", onSocketClose);
//   // socket.on("close", () => {
//   //   console.log("Disconnected from Browser ❌");
//   // });
//   // 연결된 모든 브라우저에 메세지 전송
//   socket.on("message", (msg) => {
//     const message = JSON.parse(msg);
//     // switch문과 if~else문 두가지 방법으로 가능
//     switch (message.type) {
//       case "new_message":
//         sockets.forEach((aSocket) =>
//           aSocket.send(`${socket.nickname}: ${message.payload}`)
//         );
//       case "nickname":
//         socket["nickname"] = message.payload;
//     }
// if (parsed.type === "new_message") {
//   sockets.forEach((aSocket) => aSocket.send(parsed.payload));
// } else if (parsed.type === "nickname") {
//   console.log(parsed.payload);
// }
// });
// socket.on("message", (message) => {
//   console.log(message.toString("utf8"));
// });

// send메서드는 서버에 있는게 아닌 socket에 있는 메서드이다
// socket으로 data를 보내는 것이다.
// socket.send("hello!!!");
// });

httpServer.listen(3000, handleListen);
