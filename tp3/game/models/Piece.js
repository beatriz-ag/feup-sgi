/**
 * @class Piece
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 * @param {Integer} player - Player ID
 * @param {Integer} sizeFactor - Size factor
 * @param {Boolean} isQueen - If the piece is a queen
 */
export default class Piece {
  constructor(scene, player, sizeFactor, isQueen = false) {
    this.scene = scene;
    this.player = player;
    this.sizeFactor = sizeFactor;
    this.isQueen = isQueen;

    this.id = this.getPieceID();
    this.vectors = this.getVectors();
    this.endRow = this.getEndRow();
  }

  /**
   * @method getPieceID
   * Returns the piece ID based on the player and if it's a queen
   * @returns {String} - Piece ID
   */
  getPieceID() {
    let ids = ["X", "XX"];
    this.component = "player1";

    if (this.player) {
      ids = ["Y", "YY"];
      this.component = "player2";
    }
    return this.isQueen ? ids[1] : ids[0];
  }

  /**
   * @method getVectors
   * Returns the piece vectors based on the player and if it's a queen
   * @returns {Array} - Piece vectors
   */
  getVectors() {
    if (this.isQueen) {
      return [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
    }

    if (this.player) {
      return [
        [-1, 1],
        [-1, -1],
      ];
    }

    return [
      [1, -1],
      [1, 1],
    ];
  }

  /**
   * @method getEndRow
   * Returns the end row based on the player
   * @returns {Integer} - End row
   */
  getEndRow() {
    if (this.player) {
      return 0;
    }
    return 7;
  }
}
