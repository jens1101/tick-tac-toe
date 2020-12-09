const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuid } = require("uuid");

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {});

const gameRoomIds = new Set();
const lobbyRoomIds = new Set();

// Set static folder
app.use(express.static(path.join(__dirname, "../", "public")));

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle new socket connection requests from client
io.on("connection", async (socket) => {
  const gameRoomId = await initConnection(socket);

  socket.on("disconnect", () => onSocketDisconnect(socket, gameRoomId));

  // TODO: handle the case when a game is completed
  // TODO: handle gameplay events
});

/**
 * Initialisation setup when a new client joins. This finds an available game in the lobby or, if
 * none are available, will add the player to the lobby.
 * @param socket
 * @return {string} The room ID of the game that the user is part of.
 */
async function initConnection(socket) {
  // Join a game in the lobby, if available
  if (lobbyRoomIds.size > 0) {
    const roomId = [...lobbyRoomIds].pop();
    lobbyRoomIds.delete(roomId);
    gameRoomIds.add(roomId);
    socket.join(roomId);

    /** @type {Set<>}*/
    const socketIds = await io.in(roomId).allSockets();

    const startingPlayerSocketId = [...socketIds][
      Math.floor(Math.random() * socketIds.size)
    ];

    io.to(roomId).emit("gameStart", { startingPlayerSocketId });

    return roomId;
  }

  // If there are no games that can be joined then wait in the lobby.
  const roomId = `game_room ${uuid()}`;
  lobbyRoomIds.add(roomId);
  socket.join(roomId);
  socket.emit("waitingInLobby");

  return roomId;
}

/**
 * Handles the case when a client disconnects from the server. This informs all other clients in
 * the current game (if any) that the game is aborted and removes the room from the list of rooms.
 * @param socket
 * @param gameRoomId
 */
function onSocketDisconnect(socket, gameRoomId) {
  socket.to(gameRoomId).emit("gameAbort");

  lobbyRoomIds.delete(gameRoomId);
  gameRoomIds.delete(gameRoomId);
}
