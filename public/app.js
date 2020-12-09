/* global io */

(function () {
  const socket = io();

  socket.on("waitingInLobby", () => {
    console.log("Waiting in Lobby...");
  });

  socket.on("gameStart", () => {
    console.log("The game has begun!");
  });

  socket.on("gameAbort", () => {
    console.log("Other player aborted this game");
  });
})();
