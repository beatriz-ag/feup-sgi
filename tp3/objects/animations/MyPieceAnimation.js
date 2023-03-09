import { MyKeyframeAnimation } from "./MykeyFrameAnimation.js";

/**
 * @class MyPieceAnimation
 * @extends MyKeyframeAnimation
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 * @param {Piece Object} piece - Piece to be animated
 * @param {Object} startPos - Starting position
 * @param {Object} endPos - Ending position
 * @param {Boolean} capturing - If the piece is capturing another piece
 * @param {Integer} endTime - End time
 */
export class MyPieceAnimation extends MyKeyframeAnimation {
  constructor(scene, piece, startPos, endPos, capturing, endTime) {
    super(scene);
    this.piece = piece;

    this.startPos = startPos;
    this.endPos = endPos;

    this.capturing = capturing;
    this.translationVect = {
      row: (this.endPos.row - this.startPos.row) * 4,
      col: (this.endPos.col - this.startPos.col) * 4,
    };

    this.setupKeyframes(endTime);
  }

  /**
   * @method setupKeyframes
   * Sets up the keyframes for the animation
   * @param {Integer} endTime - Animation end time
   */
  setupKeyframes(endTime) {
    this.addInitialAnimation();
    let finalInstant = 600;
    let offset = 0;

    if (this.endPos.col > 7) {
      offset = 2;
      finalInstant = endTime != null ? endTime : 2400;
      this.addWaitAnimation();
      this.addMoveUpAnimation();
      this.addMoveToFinalPosition();
      this.addFinalAnimation(2300, offset);
    }

    if (this.capturing) {
      finalInstant = 2400;
      this.addColisionAnimation();
      this.addReboundAnimation();
      this.addFinalAnimation(1500);
    }

    this.addFinalAnimation(finalInstant, offset);
  }

  /**
   * @method addInitialAnimation
   * Adds the initial animation to the keyframes
   */
  addInitialAnimation() {
    let transformation = {
      translate: [0.0, 0.0, 0.0],
      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: 0,
    };

    this.keyframes.push(keyframe);
  }

  /**
   * @method addWaitAnimation
   * Adds the wait animation to the keyframes
   */
  addWaitAnimation() {
    let transformation = {
      translate: [0.0, 0.0, 0.0],
      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: 500,
    };
    this.keyframes.push(keyframe);
  }

  /**
   * @method addMoveUpAnimation
   * Adds the move up animation to the keyframes
   */
  addMoveUpAnimation() {
    const transformation = {
      translate: [0.0, 10.0, 0.0],
      scale: [1.0, 1.0, 1.0],
      rotate: vec3.create(),
    };

    let keyframe = {
      transformation,
      instant: 1000,
    };

    this.keyframes.push(keyframe);
  }

  /**
   * @method addMoveToFinalPosition
   * Adds the move to final position animation to the keyframes
   */
  addMoveToFinalPosition() {
    const transformation = {
      translate: [this.translationVect.col, 10.0, this.translationVect.row],
      scale: [1.0, 1.0, 1.0],
      rotate: vec3.create(),
    };

    let keyframe = {
      transformation,
      instant: 1800,
    };
    this.keyframes.push(keyframe);
  }

  /**
   * @method addColisionAnimation
   * Adds the colision animation to the keyframes
   * @returns {Integer} - Final instant
   */
  addColisionAnimation() {
    let sizeFactor = this.piece.sizeFactor;
    const transformation = {
      translate: [
        this.translationVect.col / sizeFactor,
        0.0,
        this.translationVect.row / sizeFactor,
      ],
      scale: [1.0, 1.0, 1.0],
      rotate: vec3.create(),
    };

    let keyframe = {
      transformation,
      instant: 500,
    };

    this.keyframes.push(keyframe);
    return keyframe.instant;
  }

  /**
   * @method addReboundAnimation
   * Adds the rebound animation to the keyframes
   * @returns {Integer} - Final instant
   */
  addReboundAnimation() {
    const sizeFactor = this.piece.sizeFactor + 0.3;
    const transformation = {
      translate: [
        this.translationVect.col / sizeFactor,
        0.0,
        this.translationVect.row / sizeFactor,
      ],
      scale: [1.0, 1.0, 1.0],
      rotate: vec3.create(),
    };

    let keyframe = {
      transformation,
      instant: 750,
    };
    this.keyframes.push(keyframe);

    keyframe = {
      transformation,
      instant: 1000,
    };

    this.keyframes.push(keyframe);
    return keyframe.instant;
  }

  /**
   * @method addFinalAnimation
   * Adds the final animation to the keyframes
   * @param {Integer} finalInstant - End time
   * @param {Integer} offset - Animation offset
   */
  addFinalAnimation(finalInstant, offset = 0) {
    const transformation = {
      translate: [
        this.translationVect.col + offset,
        0.0 - offset,
        this.translationVect.row,
      ],
      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: finalInstant,
    };

    this.keyframes.push(keyframe);
    super.updateTimes();
  }
}
