/* global io */

(function () {
  const PLAYER_SYMBOLS = {
    circle: "circle",
    cross: "cross",
  };

  const gameStatusElement = document.getElementById("game-status");
  const gameBoardElement = document.getElementById("game-board");
  const rowTemplateElement = document.getElementById("row-template");
  const cellTemplateElement = document.getElementById("cell-template");

  const socket = io();
  let currentPlayerSymbol;
  let otherPlayerSymbol;

  socket.on("waitingInLobby", () => {
    gameStatusElement.innerHTML = "<p>Waiting in Lobby...</p>";
  });

  socket.on("gameStart", ({ startingPlayerSocketId, gameBoard }) => {
    const currentPlayerTurn = socket.id === startingPlayerSocketId;
    currentPlayerSymbol = currentPlayerTurn
      ? PLAYER_SYMBOLS.cross
      : PLAYER_SYMBOLS.circle;
    otherPlayerSymbol = currentPlayerTurn
      ? PLAYER_SYMBOLS.circle
      : PLAYER_SYMBOLS.cross;

    renderBoard(gameBoard);

    gameStatusElement.innerHTML = `
      <p>The game has begun!</p>
      <p>${currentPlayerTurn ? "Your turn" : "Other player's turn"}</p>
    `;
  });

  socket.on("gameAbort", () => {
    gameStatusElement.innerHTML = `
      <p>Other player aborted this game</p>
      <p>Refresh the page to start a new match</p>
    `;
  });

  function renderBoard(board) {
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < board.length; row++) {
      const rowFragment = rowTemplateElement.content.cloneNode(true);

      for (let column = 0; column < board[row].length; column++) {
        const cellElement = cellTemplateElement.content.cloneNode(true);
        const buttonElement = cellElement.querySelector("button.cell");

        buttonElement.addEventListener(
          "click",
          () => {
            socket.emit("makeMove", { row, column });

            switch (currentPlayerSymbol) {
              case PLAYER_SYMBOLS.circle:
                buttonElement.classList.add("cell--occupied-circle");
                break;

              case PLAYER_SYMBOLS.cross:
                buttonElement.classList.add("cell--occupied-cross");
                break;
            }
          },
          { capture: false, passive: true }
        );

        rowFragment.querySelector(".row").appendChild(cellElement);
      }

      fragment.appendChild(rowFragment);
    }

    while (gameBoardElement.firstChild) {
      gameBoardElement.firstChild.remove();
    }

    gameBoardElement.appendChild(fragment);
  }
})();
