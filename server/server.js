const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuid } = require("uuid");

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {});

const gameRoomIds = [];
const lobbyRoomIds = [];

// Set static folder
app.use(express.static(path.join(__dirname, "../", "public")));

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle new socket connection requests from client
io.on("connection", (socket) => {
  // Join a game in the lobby, if available
  if (lobbyRoomIds.length > 0) {
    const roomId = lobbyRoomIds.pop();
    gameRoomIds.push(roomId);
    joinRoom(roomId, socket);
    return;
  }

  // If there are no games that can be joined then wait in the lobby.
  const roomId = `game_room ${uuid()}`;
  lobbyRoomIds.push(roomId);
  joinRoom(roomId, socket);

  // TODO: handle the case when a game is completed
  // TODO: handle the case when a user disconnects
  // TODO: handle gameplay events
});

function joinRoom(roomId, socket) {
  socket.join(roomId);

  // TODO: if first person in room then emit wait
  // TODO: if second person to join then start the game
}
