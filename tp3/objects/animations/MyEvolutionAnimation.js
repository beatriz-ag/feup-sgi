import { MyKeyframeAnimation } from "./MykeyFrameAnimation.js";

/**
 * @class MyEvolutionAnimation
 * @extends MyKeyframeAnimation
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 * @param {Object} startPos - Starting position
 * @param {Integer} startTime - Start time
 */
export class MyEvolutionAnimation extends MyKeyframeAnimation {
  constructor(scene, startPos, startTime) {
    super(scene);
    this.startPos = startPos;

    this.setupKeyframes(startTime);
    super.updateTimes();
  }

  /**
   * @method setupKeyframes
   * Sets up the keyframes for the animation
   * @param {Integer} startTime - Animation start time
   */
  setupKeyframes(startTime) {
    let transformation = {
      translate: [0.0, 0.0, 0.0],
      scale: [0.0, 0.0, 0.0],
      rotate: [0.0, 0.0, 0.0],
    };

    let keyframe = {
      transformation,
      instant: startTime,
    };

    this.keyframes.push(keyframe);

    transformation = {
      translate: [0.0, 0.0, 0.0],
      scale: [0.5, 0.5, 0.5],
      rotate: [0.0, 180.0, 0.0],
    };

    keyframe = {
      transformation,
      instant: keyframe.instant + 800,
    };

    this.keyframes.push(keyframe);
  }

  /**
   * @method apply
   * @override
   * Applies the animation to the piece but also translates it to the correct position due to the scale of the animation
   */
  apply() {
    this.scene.translate(4 * this.startPos.col, 1.5, 4 * this.startPos.row);
    super.apply();
  }
}
