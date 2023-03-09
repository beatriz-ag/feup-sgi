import Piece from "./Piece.js";

const Empty = " ";

/**
 * @class GameBoard
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 * @param {Integer} pieceSizeFactor - Factor for the collision animation
 */
export default class GameBoard {
  constructor(scene, pieceSizeFactor) {
    this.scene = scene;

    this.player1Pieces = [
      new Piece(scene, 0, pieceSizeFactor),
      new Piece(scene, 0, pieceSizeFactor, true),
    ];
    this.player2Pieces = [
      new Piece(scene, 1, pieceSizeFactor),
      new Piece(scene, 1, pieceSizeFactor, true),
    ];

    this.board = new Array(8);
    for (let i = 0; i < this.board.length; i++) {
      this.board[i] = new Array(8).fill(Empty);
    }

    this.fillBoard(0, this.player1Pieces[0].id);
    this.fillBoard(5, this.player2Pieces[0].id);

    this.createAuxiliarBoard();
  }

  /**
   * @method fillBoard
   * Fills the board with the pieces of a player
   * @param {Integer} start - Start row
   * @param {String} piece - Piece id
   */
  fillBoard(start, piece) {
    for (let i = start; i < start + 3; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 != 0) {
          this.board[i][j] = piece;
        }
      }
    }
  }

  /**
   * @method createAuxiliarBoard
   * Creates an auxiliar board to store the pieces that are being captured
   */
  createAuxiliarBoard() {
    this.auxiliarBoard = new Array(8);
    for (let i = 0; i < this.auxiliarBoard.length; i++) {
      this.auxiliarBoard[i] = new Array(3).fill(Empty);
    }
  }

  /**
   * @method setBoard
   * Sets the board to a given board
   * @param {Array} board - Board to be set
   * @param {Boolean} copy - If true, creates a copy of the given board
   */
  setBoard(board, copy = false) {
    this.board = copy ? board.map((row) => row.slice()) : board;
  }

  /**
   * @method setAuxiliarBoard
   * Sets the auxiliar board to a given board
   * @param {Array} board - Board to be set
   * @param {Boolean} copy - If true, creates a copy of the given board
   */
  setAuxiliarBoard(board, copy = false) {
    this.auxiliarBoard = copy ? board.map((row) => row.slice()) : board;
  }

  /**
   * @method getBoardCopy
   * Returns a copy of the board
   * @return {Array} - Copy of the board
   */
  getBoardCopy() {
    return this.board.map((row) => row.slice());
  }

  /**
   * @method getAuxiliarBoardCopy
   * Returns a copy of the auxiliar board
   * @return {Array} - Copy of the auxiliar board
   */
  getAuxiliarBoardCopy() {
    return this.auxiliarBoard.map((row) => row.slice());
  }

  /**
   * @method setpiece
   * Sets a piece in a given position of the board
   * @param {String} piece - Piece id
   * @param {Object} position - Position of the piece
   */
  setPiece(piece, position) {
    this.board[position.row][position.col] = piece;
  }

  /**
   * @method getPlayerPieces
   * Returns the pieces of a given player
   * @param {Integer} player - Player id
   * @return {Array} - Pieces of the player
   */
  getPlayerPieces(player) {
    return player ? this.player2Pieces : this.player1Pieces;
  }

  /**
   * @method setValidMoves
   * Sets the valid moves of a given player
   * If a start position is given, only the moves from that position are set
   * @param {Integer} player - Player id
   * @param {Object} startPos - Capture mandatory position
   */
  setValidMoves(player, startPos = null) {
    const { moves, capturing } = this.getValidMoves(player, startPos);
    this.moves = moves;
    this.capturing = capturing;
  }

  /**
   * @method getValidMoves
   * Returns the valid moves of a given player
   * If a start position is given, only the moves from that position are returned
   * @param {Integer} player - Player id
   * @param {Object} startPos - Capture mandatory position
   * @return {Object} - Valid moves
   */
  getValidMoves(player, startPos = null) {
    const pieces = this.getPlayerPieces(player);
    const opponentPieces = this.getPlayerPieces(!player);

    const moves = {
      normal: {},
      capture: {},
    };

    if (startPos != null) {
      const vectors =
        this.board[startPos.row][startPos.col] == pieces[0].id
          ? pieces[0].vectors
          : pieces[1].vectors;
      this.getPositionMoves(startPos, vectors, moves, opponentPieces);
      return { moves: moves.capture, capturing: true };
    }

    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board.length; col++) {
        let vectors = [];
        if (this.board[row][col] == pieces[0].id) vectors = pieces[0].vectors;
        else if (this.board[row][col] == pieces[1].id)
          vectors = pieces[1].vectors;
        else continue;

        const pos = { row, col };
        this.getPositionMoves(pos, vectors, moves, opponentPieces);
      }
    }

    return Object.keys(moves.capture).length > 0
      ? { moves: moves.capture, capturing: true }
      : { moves: moves.normal, capturing: false };
  }

  /**
   * @method getPositionMoves
   * Returns the valid moves of a given position
   * @param {Object} pos - Position
   * @param {Array} vectors - Vectors of the piece
   * @param {Object} moves - Valid moves reference to be updated
   * @param {Array} opponentPieces - Opponent pieces
   */
  getPositionMoves(pos, vectors, moves, opponentPieces) {
    for (const vect of vectors) {
      if (this.canCapture(pos, vect, opponentPieces)) {
        const arr = moves.capture[JSON.stringify(pos)] || [];
        arr.push({
          row: pos.row + 2 * vect[0],
          col: pos.col + 2 * vect[1],
        });
        moves.capture[JSON.stringify(pos)] = arr;
      }

      if (Object.keys(moves.capture).length > 0) continue;

      const newPos = { row: pos.row + vect[0], col: pos.col + vect[1] };
      if (this.canMove(newPos)) {
        const arr = moves.normal[JSON.stringify(pos)] || [];
        arr.push(newPos);
        moves.normal[JSON.stringify(pos)] = arr;
      }
    }
  }

  /**
   * @method getAuxiliarBoardPosition
   * Returns the position of the first empty space in the auxiliar board for a given player
   * @param {Integer} player - Player id
   * @return {Object} - Position of the first empty space in reference to the main board
   */
  getAuxiliarBoardPosition(player) {
    const rowIncrement = player ? 4 : 0;
    const rowCap = player ? 8 : 4;

    for (let row = rowIncrement; row < rowCap; row++) {
      for (let col = 0; col < this.auxiliarBoard[1].length; col++) {
        if (this.auxiliarBoard[row][col] == Empty) {
          return { row, col: col + 8 };
        }
      }
    }
  }

  /**
   * @method canCapture
   * Returns if a piece can capture in a given direction
   * @param {Object} pos - Position of the piece
   * @param {Array} vect - Direction vector
   * @param {Array} opponentPieces - Opponent pieces
   * @return {Boolean} - If the piece can capture
   */
  canCapture(pos, vect, opponentPieces) {
    const intermediatePos = {
      row: pos.row + vect[0],
      col: pos.col + vect[1],
    };
    const finalPos = {
      row: intermediatePos.row + vect[0],
      col: intermediatePos.col + vect[1],
    };

    if (!this.canMove(finalPos)) return false;

    const piece = this.board[intermediatePos.row][intermediatePos.col];
    return piece === opponentPieces[0].id || piece === opponentPieces[1].id;
  }

  /**
   * @method canMove
   * Returns if a piece can move to a given position
   * @param {Object} pos - Position to move to
   * @return {Boolean} - If the piece can move
   */
  canMove(pos) {
    return !this.outsideBoard(pos) && this.isEmpty(pos);
  }

  /**
   * @method executeMove
   * Executes a move in the board by placing a piece in a given position
   * @param {Integer} piece - Piece id
   * @param {Integer} player - Player id
   * @param {Object} endPos - Position to move to
   */
  executeMove(piece, player, endPos) {
    const playerPieces = this.getPlayerPieces(player);
    const playerPiece =
      piece === playerPieces[0].id ? playerPieces[0] : playerPieces[1];

    if (playerPiece.isQueen || playerPiece.endRow == endPos.row)
      this.board[endPos.row][endPos.col] = playerPieces[1].id;
    else this.board[endPos.row][endPos.col] = piece;
  }

  /**
   * @method fillAuxiliarBoard
   * Places a piece in the first empty position of the auxiliar board for a given player
   * @param {Integer} player - Player id
   * @param {Integer} piece - Piece id
   */
  fillAuxiliarBoard(player, piece) {
    const pos = this.getAuxiliarBoardPosition(1 - player);
    this.auxiliarBoard[pos.row][pos.col - 8] = piece;
  }

  /**
   * @method isUpgradeMove
   * Returns if a move is an upgrade move for a given player
   * @param {Integer} player - Player id
   * @param {Object} startPos - Position to move from
   * @param {Object} endPos - Position to move to
   * @return {Boolean} - If the move is an upgrade move
   */
  isUpgradeMove(player, startPos, endPos) {
    const piece = this.board[startPos.row][startPos.col];
    const playerPieces = this.getPlayerPieces(player);
    return (
      piece === playerPieces[0].id && endPos.row === playerPieces[0].endRow
    );
  }

  /**
   * @method filterClicablePositions
   * Returns the clicable and non clicable positions for a given clicked position
   * @param {Object} clickedPos - Position of the clicked piece
   * @param {Boolean} canClick - If the player can click
   * @return {Array} - Array with the clicable and non clicable positions
   */
  filterClicablePositions(clickedPos, canClick) {
    const clicablePositions = [];
    const nonClickablePositions = [];

    for (let row = 0; row < this.board.length; row++)
      for (let col = 0; col < this.board.length; col++)
        nonClickablePositions.push(JSON.stringify({ row, col }));
    if (!canClick) return [[], nonClickablePositions];

    if (clickedPos != null) clickedPos = JSON.stringify(clickedPos);

    for (const pos of Object.keys(this.moves)) {
      if (clickedPos === pos) {
        clicablePositions.push(
          ...this.moves[pos].map((pos) => {
            return { ...pos, isMovement: true };
          })
        );
      }
      const index = nonClickablePositions.indexOf(pos);
      nonClickablePositions.splice(index, 1);

      clicablePositions.push({ ...JSON.parse(pos), isMovement: false });
    }
    return [clicablePositions, nonClickablePositions];
  }

  /**
   * @method emptyPosition
   * Empties a position in the board or auxiliar board
   * @param {Object} pos - Position to empty
   * @return {Integer} - Piece id
   */
  emptyPosition({ row, col }) {
    col = Math.floor(col);
    if (col > 7) {
      const pieceId = this.auxiliarBoard[row][col - 8];
      this.auxiliarBoard[row][col - 8] = Empty;
      return pieceId;
    }
    const pieceId = this.board[row][col];
    this.board[row][col] = Empty;
    return pieceId;
  }

  /**
   * @method intermediatePosition
   * Returns the intermediate position between two positions
   * @param {Object} startPos - Start position
   * @param {Object} endPos - End position
   * @return {Object} - Intermediate position
   */
  intermediatePosition(startPos, endPos) {
    return {
      row: (startPos.row + endPos.row) / 2,
      col: (startPos.col + endPos.col) / 2,
    };
  }

  /**
   * @method isEmpty
   * Returns if a position is empty
   * @param {Object} pos - Position to check
   * @return {Boolean} - If the position is empty
   */
  isEmpty({ row, col }) {
    return this.board[row][col] === Empty;
  }

  /**
   * @method outsideBoard
   * Returns if a position is outside the board
   * @param {Object} pos - Position to check
   * @return {Boolean} - If the position is outside the board
   */
  outsideBoard({ row, col }) {
    return row < 0 || row > 7 || col < 0 || col > 7;
  }

  /**
   * @method existMoves
   * Returns if the current player has moves
   * @return {Boolean} - If the player has moves
   */
  existMoves() {
    return Object.keys(this.moves).length > 0;
  }

  /**
   * @method getPieceFromId
   * Returns a piece object from a given id
   * @param {Integer} id - Piece id
   * @return {Object} - Piece object
   */
  getPieceFromId(id) {
    if (id.length > 1)
      return id == this.player1Pieces[1].id
        ? this.player1Pieces[1]
        : this.player2Pieces[1];
    return id == this.player1Pieces[0].id
      ? this.player1Pieces[0]
      : this.player2Pieces[0];
  }

  /**
   * @method getPlayerPiece
   * Returns a piece object from a given position
   * @param {Object} pos - Position to get the piece from
   * @return {Object} - Piece object
   */
  getPlayerPiece({ row, col }) {
    const pieceId = this.board[row][col];
    if (pieceId == Empty) return null;

    return this.getPieceFromId(pieceId);
  }

  /**
   * @method getAuxiliarBoardPiece
   * Returns a piece object from a given position in the auxiliar board
   * @param {Object} pos - Position to get the piece from
   * @return {Object} - Piece object
   */
  getAuxiliarBoardPiece({ row, col }) {
    const pieceId = this.auxiliarBoard[row][col];
    if (pieceId == Empty) return null;

    return this.getPieceFromId(pieceId);
  }
}
