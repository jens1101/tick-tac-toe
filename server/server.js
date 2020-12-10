const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const { v4: uuid } = require("uuid");

const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {});

const games = new Map();
const lobbyRoomIds = new Set();

// Set static folder
app.use(express.static(path.join(__dirname, "../", "public")));

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle new socket connection requests from client
io.on("connection", async (socket) => {
  const gameRoomId = await initConnection(socket);

  socket.on("disconnect", () => onSocketDisconnect(socket, gameRoomId));

  socket.on("makeMove", ({ row, column }) => {
    const winnerSocketId = makeMove(
      socket.id,
      games.get(gameRoomId).gameBoard,
      {
        row,
        column,
      }
    );

    if (winnerSocketId) {
      // TODO: handle the case when a game is completed
      console.log(`${winnerSocketId} has won the game`);
    }
  });
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
    const gameBoard = createEmptyBoard();

    const roomId = [...lobbyRoomIds].pop();
    lobbyRoomIds.delete(roomId);
    games.set(roomId, {
      gameBoard,
    });
    socket.join(roomId);

    /** @type {Set<>}*/
    const socketIds = await io.in(roomId).allSockets();

    const startingPlayerSocketId = [...socketIds][
      Math.floor(Math.random() * socketIds.size)
    ];

    io.to(roomId).emit("gameStart", { startingPlayerSocketId, gameBoard });

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
  games.delete(gameRoomId);
}

/**
 * Creates and returns an empty game board.
 * @return {(null|string)[][]}
 */
function createEmptyBoard() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

/**
 * Makes a move by the given player on the specified cell. This checks if the move is valid, updates
 * the board, and checks if anybody has won.
 * @param socketId
 * @param board
 * @param row
 * @param column
 * @return {undefined|string} The socketID of the winner of this game. If nobody has won yet then
 * returns undefined instead.
 */
function makeMove(socketId, board, { row, column }) {
  if (!isOnBoard(board, { row, column })) {
    throw new Error("Invalid move. Cell is not on board.");
  }

  if (board[row][column]) {
    throw new Error("Invalid move. Cell is not empty.");
  }

  board[row][column] = socketId;

  return checkForWinner(board);
}

/**
 * Checks if the specified cell is on the board
 * @param board
 * @param row
 * @param column
 * @return {boolean}
 */
function isOnBoard(board, { row, column }) {
  return (
    row >= 0 && row < board.length && column >= 0 && column < board[row].length
  );
}

/**
 * For the specified board checks if anybody has won.
 * @param board The 3x3 board to check
 * @return {undefined|string} The socketID of the winner on this board or undefined if nobody has
 * won.
 */
function checkForWinner(board) {
  const streaks = [
    // Rows
    ...board,

    // Columns
    [board[0][0], board[1][0], board[2][0]],
    [board[0][1], board[1][1], board[2][1]],
    [board[0][2], board[1][2], board[2][2]],

    // Diagonals
    [board[0][0], board[1][1], board[2][2]],
    [board[0][2], board[1][1], board[2][0]],
  ];

  for (const streak of streaks) {
    const winner = getWinner(streak);

    if (winner) return winner;
  }
}

function getWinner(streak) {
  let winner = streak[0];

  for (const cell of streak) {
    if (cell !== winner) {
      return;
    }
  }

  return winner;
}
