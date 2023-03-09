import { MyAnimation } from "./MyAnimation.js";

/**
 * @class MyKeyframeAnimation
 * @extends MyAnimation
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 */
export class MyKeyframeAnimation extends MyAnimation {
  constructor(scene) {
    super(scene);
    this.keyframes = [];

    this.keyframeIndex = 0;
    this.finalKeyframe = false;
  }

  /**
   * @method updateTimes
   * Updates the initial and final animation instants according to the keyframes
   */
  updateTimes() {
    super.updateTimes(
      this.keyframes[0].instant,
      this.keyframes[this.keyframes.length - 1].instant
    );
    if (this.keyframes[0].instant == 0) this.active = true;
  }

  /**
   * @method addKeyframe
   * Appends a new keyframe to the keyframes array
   * @param {Object} keyframe - Object containing keyframe transformation and instant
   */
  addKeyframe(keyframe) {
    this.keyframes.push(keyframe);
  }

  /**
   * @method update
   * Calculates the new currentTransformation attribute according to current keyframe and fraction of elapsed time
   * @param {integer} t - Time since last update call
   */
  update(t) {
    this.totalTime += t;

    if (this.totalTime > this.endTime) {
      if (!this.finalKeyframe) {
        this.updateTransformationMatrix(
          this.keyframes[this.keyframes.length - 1].transformation
        );
        this.finalKeyframe = true;
      }
      return;
    }

    if (!this.active) {
      if (this.totalTime > this.startTime) this.active = true;
      else return;
    }

    // Update keyframeIndex
    while (this.totalTime > this.keyframes[this.keyframeIndex + 1].instant) {
      this.keyframeIndex++;
      if (this.keyframeIndex == this.keyframes.length - 1) break;
    }

    const currentKeyframe = this.keyframes[this.keyframeIndex];
    const nextKeyframe = this.keyframes[this.keyframeIndex + 1];

    const timePercentage =
      (this.totalTime - currentKeyframe.instant) /
      (nextKeyframe.instant - currentKeyframe.instant);

    var newTransformation = {
      translate: [],
      scale: [],
      rotate: vec3.create(),
    };

    vec3.lerp(
      newTransformation.translate,
      currentKeyframe.transformation.translate,
      nextKeyframe.transformation.translate,
      timePercentage
    );
    vec3.lerp(
      newTransformation.scale,
      currentKeyframe.transformation.scale,
      nextKeyframe.transformation.scale,
      timePercentage
    );
    vec3.lerp(
      newTransformation.rotate,
      currentKeyframe.transformation.rotate,
      nextKeyframe.transformation.rotate,
      timePercentage
    );

    this.updateTransformationMatrix(newTransformation);
  }

  /**
   * @method updateTransformationMatrix
   * Updates the currentTransformation attribute according to the given parameter
   * @param {Object} transformation - Object with translate, scale and rotate vectors
   */
  updateTransformationMatrix(transformation) {
    var { translate, rotate, scale } = transformation;
    var matrix = mat4.create();

    mat4.translate(matrix, matrix, translate);
    mat4.rotate(matrix, matrix, rotate[2], [0, 0, 1]);
    mat4.rotate(matrix, matrix, rotate[1], [0, 1, 0]);
    mat4.rotate(matrix, matrix, rotate[0], [1, 0, 0]);
    mat4.scale(this.currentTransformation, matrix, scale);
  }

  /**
   * @method revert
   * Reverts the animation by inverting the keyframes and their instants
   */
  revert() {
    const newKeyframes = [];
    let instant = 0;
    let tempInstant = null;

    for (let i = this.keyframes.length - 1; i >= 0; i--) {
      const keyframe = this.keyframes[i];
      keyframe.transformation.rotate = keyframe.transformation.rotate.map(
        (x) => -1 * x
      );

      if (tempInstant != null) instant += tempInstant - keyframe.instant;

      tempInstant = keyframe.instant;
      keyframe.instant = instant;

      newKeyframes.push(keyframe);
    }
    this.keyframes = newKeyframes;

    this.reset();
    this.updateTimes();
  }

  /**
   * @method reset
   * Resets the animation to its initial state
   * @override
   */
  reset() {
    super.reset();
    this.keyframeIndex = 0;
    this.finalKeyframe = false;
  }
}
