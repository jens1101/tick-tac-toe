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

  const playerSymbols = new Map();
  let isGameRunning = false;

  socket.on("waitingInLobby", () => {
    resetGame();

    gameStatusElement.innerHTML = "<p>Waiting in Lobby...</p>";
  });

  socket.on("gameMove", onGameMove);

  socket.on("gameAbort", () => {
    resetGame();

    gameStatusElement.innerHTML = `
      <p>Other player aborted this game</p>
      <p>Refresh the page to start a new match</p>
    `;
  });

  function resetGame() {
    playerSymbols.clear();
    isGameRunning = false;
  }

  /**
   *
   * @param {RunningGame} game
   * @param {string} winnerSocketId
   */
  function onGameMove({ game, winnerSocketId }) {
    const currentPlayerTurn = socket.id === game.currentPlayerSocketId;

    if (!isGameRunning) {
      isGameRunning = true;

      for (const socketId of game.playerSocketIds) {
        const symbol =
          socketId === game.currentPlayerSocketId
            ? PLAYER_SYMBOLS.cross
            : PLAYER_SYMBOLS.circle;

        playerSymbols.set(socketId, symbol);
      }

      renderBoard(game.gameBoard);

      gameStatusElement.innerHTML = `
        <p>The game has begun!</p>
        <p>${currentPlayerTurn ? "Your turn" : "Other player's turn"}</p>
      `;

      return;
    }

    gameStatusElement.innerHTML = `
        <p>${currentPlayerTurn ? "Your turn" : "Other player's turn"}</p>
      `;

    renderBoard(game.gameBoard);
  }

  function renderBoard(board) {
    const fragment = document.createDocumentFragment();

    for (let row = 0; row < board.length; row++) {
      const rowFragment = rowTemplateElement.content.cloneNode(true);

      for (let column = 0; column < board[row].length; column++) {
        const cellElement = cellTemplateElement.content.cloneNode(true);
        const buttonElement = cellElement.querySelector("button.cell");

        const playerSymbol = playerSymbols.get(board[row][column]);
        switch (playerSymbol) {
          case PLAYER_SYMBOLS.circle:
            buttonElement.classList.add("cell--occupied-circle");
            break;

          case PLAYER_SYMBOLS.cross:
            buttonElement.classList.add("cell--occupied-cross");
            break;

          default:
            break;
        }

        buttonElement.addEventListener(
          "click",
          () => socket.emit("makeMove", { row, column }),
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
