/* global io */

(function () {
  const socket = io();

  socket.on("waitingInLobby", () => {
    console.log("Waiting in Lobby...");
  });

  socket.on("gameStart", ({ startingPlayerSocketId }) => {
    console.log(
      `The game has begun! Starting player: ${startingPlayerSocketId}`
    );

    socket.id === startingPlayerSocketId
      ? console.log("My turn")
      : console.log("Other player's turn");
  });

  socket.on("gameAbort", () => {
    console.log("Other player aborted this game");
  });
})();
