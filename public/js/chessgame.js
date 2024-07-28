const socket = io();

const chess = new Chess(); // Instantiate the Chess.js object
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Function to render the chessboard
const renderBoard = () => {
  const board = chess.board();
  boardElement.innerHTML = ""; // Clear the board before rendering

  board.forEach((row, rowIndex) => {
    row.forEach((square, squareIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + squareIndex) % 2 == 0 ? "light" : "dark"
      );
      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = squareIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add("piece", square.color === "w" ? "white" : "black");
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.color;

        pieceElement.addEventListener("dragstart", (e) => {
          if (pieceElement.draggable) {
            console.log("Drag started for piece:", pieceElement.innerText);
            draggedPiece = pieceElement;
            sourceSquare = { row: rowIndex, col: squareIndex };
            e.dataTransfer.setData("text/plain", "");
          }
        });

        pieceElement.addEventListener("dragend", () => {
          console.log("Drag ended");
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", function (e) {
        e.preventDefault(); // Allow drop
      });

      squareElement.addEventListener("drop", function (e) {
        e.preventDefault();
        if (draggedPiece) {
          const targetSquare = {
            row: parseInt(squareElement.dataset.row),
            col: parseInt(squareElement.dataset.col),
          };
          console.log("Drop on square:", targetSquare);
          handleMove(sourceSquare, targetSquare);
        }
      });

      boardElement.appendChild(squareElement);
    });
  });

  // Flip the board for the black player
  if (playerRole === "b") {
    boardElement.classList.add("flipped");
  } else {
    boardElement.classList.remove("flipped");
  }
};

// Function to handle the move and update the board
const handleMove = (source, target) => {
  const move = chess.move({
    from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
    to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
    promotion: "q", // Always promote to a queen for simplicity
  });

  if (move === null) {
    console.log("Invalid move attempted");
    return; // Invalid move
  }

  console.log("Move executed:", move);

  socket.emit("move", move); // Emit the move to the server
  renderBoard();
};

// Function to get the unicode representation of chess pieces
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    // Lowercase for black pieces
    p: "♟", // Black Pawn
    r: "♜", // Black Rook
    n: "♞", // Black Knight
    b: "♝", // Black Bishop
    q: "♛", // Black Queen
    k: "♚", // Black King
    // Uppercase for white pieces
    P: "♙", // White Pawn
    R: "♖", // White Rook
    N: "♘", // White Knight
    B: "♗", // White Bishop
    Q: "♕", // White Queen
    K: "♔", // White King
  };

  // Use piece.color to decide case: 'w' for white, 'b' for black
  const type = piece.color === "w" ? piece.type.toUpperCase() : piece.type;
  return unicodePieces[type] || "";
};

// Socket event listeners
socket.on("player_assigned", function (data) {
  playerRole = data.color;
  console.log(`Assigned as ${playerRole}`);
  renderBoard();
});

socket.on("spectatorRole", function () {
  playerRole = null;
  console.log("Assigned as Spectator");
  renderBoard();
});

socket.on("boardState", function (fen) {
  chess.load(fen);
  renderBoard();
});

socket.on("move", function (move) {
  chess.move(move);
  renderBoard();
});

socket.on("invalidmove", function (move) {
  console.log("Received invalid move:", move);
});

// Initial rendering of the board
renderBoard();
