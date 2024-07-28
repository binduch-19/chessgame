const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});

io.on("connection", (uniquesocket) => {
  console.log(`Client connected: ${uniquesocket.id}`);

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("player_assigned", { color: "w" });
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("player_assigned", { color: "b" });
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;
      
      const result = chess.move(move); // if it is a valid move, update the game
      if (result) {
        io.emit("move", move);
        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid move: ", move);
        uniquesocket.emit("invalidmove", move);
      }
    } catch (err) {
      console.log(err);
      uniquesocket.emit("Invalid move: ", move);
    }
  });
});

server.listen(3000, function () {
  console.log("Listening on port 3000");
});
