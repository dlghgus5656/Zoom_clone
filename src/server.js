import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () =>
  console.log(`Listening on http(ws)://localhost:3000`);

// 같은 서버에서 http, webSocket 둘 다 작동시키는 준비(꼭 둘다 작동 시켜야하는것은 아니다, 웹소켓서버만 작동해도 상관없음)
// 여기선 두 서버가 같은 포트에 있으면해서 이렇게 함
// 서버를 만들고(보이게 노출시키고) 그 다음 http서버 위에 ws서버를 만들기 위함
//  http서버가 필요한 이유는 views, static files, home, redirection 를 사용하기 위함
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

server.listen(3000, handleListen);
