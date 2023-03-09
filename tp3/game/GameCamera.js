/**
 * @class GameCamera
 * @classdesc Class that represents the camera of the game
 * @constructor
 * @param {CGFcamera} camera - Reference to the camera
 */
export default class GameCamera {
  constructor(camera) {
    this.camera = camera;

    this.target = vec3.fromValues(14, 0, 14);
    this._up = vec3.fromValues(0, 1, 0);

    this.cameraIndex = 0;
    this.cameraPositions = [
      {
        // Player 1
        position: vec3.fromValues(14, 15, -22),
      },
      {
        // General
        position: vec3.fromValues(-30, 20, 14),
      },
      {
        // Player 2
        position: vec3.fromValues(14, 15, 50),
      },
    ];

    this.cameraAnimation = null;
    this.changeCamera(1);
  }

  /**
   * @method getPosition
   * @returns {Array} - Camera position
   */
  getPosition() {
    const pos = this.camera.position;
    return vec3.fromValues(pos[0], pos[1], pos[2]);
  }

  /**
   * @method inPlace
   * Checks if the camera is in place
   * @returns {Boolean} - True if the camera is in place
   */
  inPlace() {
    const { position } = this.cameraPositions[this.cameraIndex];
    const curPos = vec3.fromValues(
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2]
    );
    const curTarget = vec3.fromValues(
      this.camera.target[0],
      this.camera.target[1],
      this.camera.target[2]
    );
    const curUp = vec3.fromValues(
      this.camera._up[0],
      this.camera._up[1],
      this.camera._up[2]
    );

    return (
      JSON.stringify(curPos) == JSON.stringify(position) &&
      JSON.stringify(curTarget) == JSON.stringify(this.target) &&
      JSON.stringify(curUp) == JSON.stringify(this._up)
    );
  }

  /**
   * @method changeCamera
   * Changes the camera position to the next one if not in place
   * @param {Integer} cameraIndex - Index of the camera position to change to
   */
  changeCamera(cameraIndex = null) {
    this.cameraIndex =
      cameraIndex == null
        ? (this.cameraIndex + 1) % this.cameraPositions.length
        : cameraIndex;

    if (this.cameraAnimation != null || this.inPlace()) return;

    this.cameraAnimation = {
      elapsedTime: 0,
      interval: 700,
    };
  }

  /**
   * @method update
   * Updates the camera position
   * @param {integer} time - Time elapsed since last update
   */
  update(time) {
    if (this.cameraAnimation == null) return;

    this.cameraAnimation.elapsedTime += time;

    if (this.cameraAnimation.elapsedTime > this.cameraAnimation.interval) {
      this.cameraAnimation = null;
      // Last transition
      this.camera.setPosition(this.cameraPositions[this.cameraIndex].position);
      this.camera.setTarget(this.target);
      vec3.copy(this.camera._up, this._up);
      return;
    }

    const timePercentage =
      this.cameraAnimation.elapsedTime / this.cameraAnimation.interval;
    const curCamera = this.cameraPositions[this.cameraIndex];

    let curTarget = vec3.fromValues(
      this.camera.target[0],
      this.camera.target[1],
      this.camera.target[2]
    );
    if (JSON.stringify(curTarget) != JSON.stringify(this.target)) {
      vec3.lerp(curTarget, curTarget, this.target, timePercentage);
      this.camera.setTarget(curTarget);
    }

    let curPos = vec3.fromValues(
      this.camera.position[0],
      this.camera.position[1],
      this.camera.position[2]
    );
    if (JSON.stringify(curPos) != JSON.stringify(curCamera.position)) {
      vec3.lerp(curPos, curPos, curCamera.position, timePercentage);
      this.camera.setPosition(curPos);
    }

    let curUp = vec3.fromValues(
      this.camera._up[0],
      this.camera._up[1],
      this.camera._up[2]
    );
    if (JSON.stringify(curUp) != JSON.stringify(this._up)) {
      vec3.lerp(curUp, curUp, this._up, timePercentage);
      vec3.copy(this.camera._up, this._up);
    }
  }

  /**
   * @method resetPosition
   * Resets the camera position
   */
  resetPosition() {
    this.changeCamera(1);
  }
}
