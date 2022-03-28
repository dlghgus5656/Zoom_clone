// Back-End 부분
import express from "express";
import http from "http";
// import WebSocket, { WebSocketServer } from "ws";
import { Server, Socket } from "socket.io";

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
const wsServer = new Server(httpServer);

// 프론트에서 백으로 연결
wsServer.on("connection", (socket) => {
  socket.on("enter_room", (msg, done) => {
    console.log(msg);
    setTimeout(() => {
      done();
    }, 10000);
  });
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
