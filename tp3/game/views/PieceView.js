/**
 * @class PieceView
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 */
export default class PieceView {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * @method display
   * Displays the piece at a given position
   * @param {Object} pos - Piece position
   * @param {Piece} piece - Piece model
   * @param {Integer} colOffset - Collumn offset
   */
  display(pos, piece, colOffset = 0) {
    let { height } = pos;
    const component = piece.component;

    if (!height) height = 1.7;

    let node = this.scene.graph.components[component];

    this.scene.pushMatrix();

    this.scene.translate(4 * pos.col + colOffset, height, 4 * pos.row);
    this.scene.scale(0.5, 0.5, 0.5);
    this.scene.graph.processNode(node, null, null);

    if (piece.isQueen) {
      this.displayCrown();
    }
    this.scene.popMatrix();
  }

  /**
   * @method displayCrown
   * Displays the crown on top of the piece
   */
  displayCrown() {
    const node = this.scene.graph.components["crown"];
    this.scene.graph.processNode(node, null, null);
  }
}
