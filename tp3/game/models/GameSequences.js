/**
 * @class GameSequences
 * @classdesc Class that represents the game sequences
 * @constructor
 */
export default class GameSequences {
  constructor() {
    this.sequences = [];
  }

  /**
   * @method getSequence
   * Gets a sequence from the sequences array by index
   * @param {Integer} idx - Sequence index
   * @returns {Object} sequence
   */
  getSequence(idx) {
    if (idx > this.sequences.length - 1) return null;
    return this.sequences[idx];
  }

  /**
   * @method hasSequences
   * Checks if there are sequences in the array of sequences
   * @returns {Boolean} - True if there are sequences
   */
  hasSequences() {
    return this.sequences.length > 0;
  }

  /**
   * @method addSequence
   * Adds a sequence to the array of sequences
   * @param {Array} board - Sequence board
   * @param {Array} auxiliarBoard - Sequence auxiliar board
   * @param {Integer} playerTurn - Player turn
   * @param {Array} scores - Player scores
   * @param {Boolean} mandatoryPlay - True if the player has to play in the start position
   */
  addSequence(board, auxiliarBoard, playerTurn, scores, mandatoryPlay) {
    this.sequences.push({
      board,
      auxiliarBoard,
      moves: [],
      playerTurn,
      scores,
      mandatoryPlay,
    });
  }

  /**
   * @method addAnimation
   * Adds an animation to the last sequence in the array of sequences
   * @param {Animation Object} animation - Animation object
   */
  addAnimation(animation) {
    this.sequences[this.sequences.length - 1].moves.push(animation);
  }

  /**
   * @method undo
   * Removes the last sequence from the array of sequences
   * @returns {Object} - Sequence
   */
  undo() {
    return this.sequences.pop();
  }

  /**
   * @method updateSequence
   * Updates the last sequence in the array of sequences
   * @param {Object} val - New sequence values
   */
  updateSequence(val) {
    this.sequences[this.sequences.length - 1] = {
      ...this.sequences[this.sequences.length - 1],
      ...val,
    };
  }

  /**
   * @method reset
   * Resets the array of sequences to an empty array
   */
  reset() {
    this.sequences = [];
  }
}
