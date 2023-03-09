/**
 * @class MyAnimation
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 */
export class MyAnimation {
  constructor(scene) {
    this.scene = scene;

    // Animation times
    this.startTime;
    this.endTime;
    this.totalTime = 0;

    this.active = false;
    this.currentTransformation = mat4.create();
  }

  /**
   * @method updateTimes
   * Updates the initial and final animation instants
   * @param {float} startTime - Animation start instant
   * @param {float} endTime - Animation end instant
   */
  updateTimes(startTime, endTime) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.totalTime = 0;
  }

  /**
   * @method update
   * Abstract funtion that updates the currentTransformation attribute
   * @param {integer} t - Time since last update call
   */
  update(t) {}

  /**
   * @method apply
   * Applies the animation (transformation matrix) to the scene object if it active
   */
  apply() {
    if (!this.active) return;

    this.scene.multMatrix(this.currentTransformation);
  }

  /**
   * @method isActive
   * Checks if the animation is active
   * @returns {Boolean} - If the animation is active
   */
  isActive() {
    return this.active;
  }

  /**
   * @method hasEnded
   * Checks if the animation has ended
   * @returns {Boolean} - If the animation has ended
   */
  hasEnded() {
    return this.totalTime > this.endTime;
  }

  /**
   * @method reset
   * Resets the animation to its initial state (totalTime = 0, active = false)
   */
  reset() {
    this.totalTime = 0;
    this.active = false;
  }
}
