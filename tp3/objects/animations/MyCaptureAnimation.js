import { MyKeyframeAnimation } from "./MykeyFrameAnimation.js";
import { getRandomInt } from "../../game/GameUtils.js";

const AxisCombination = [
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
];

/**
 * @class MyCaptureAnimation
 * @extends MyKeyframeAnimation
 * @constructor
 * @param {CGFscene} scene - Reference to MyScene object
 * @param {Object} startPos - Starting position
 * @param {Object} intermediatePos - Intermediate position
 * @param {Object} endPos - Ending position
 * @param {Integer} endTime - End time
 */
export class MyCaptureAnimation extends MyKeyframeAnimation {
  constructor(scene, startPos, intermediatePos, endPos, endTime) {
    super(scene);

    this.startPos = startPos;
    this.intermediatePos = intermediatePos;

    this.translationVect = {
      row: (endPos.row - this.intermediatePos.row) * 4,
      col: (endPos.col - this.intermediatePos.col) * 4,
    };

    this.endPos = { row: endPos.row * 4, col: endPos.col * 4 + 2 };

    this.calculateStartPos();

    this.setupKeyframes(endTime);
  }

  /**
   * @method calculateStartPos
   * Calculates the start position and the direction it will have to face to capture the piece
   */
  calculateStartPos() {
    let direction = [
      this.intermediatePos.col * 4 - this.startPos[0],
      4 - this.startPos[1],
      this.intermediatePos.row * 4 - this.startPos[2],
    ];
    vec3.normalize(direction, direction);

    this.facing = Math.atan2(direction[0], direction[2]);
    this.startPos = this.findPointInNormalPlane(this.startPos, direction);
  }

  /**
   * @method findPointInNormalPlane
   * Finds a random point in the plane defined by the normal vector and the point
   * @param {Array} point - Point in the plane
   * @param {Array} normal - Normal vector
   * @returns {Array} - Random point
   */
  findPointInNormalPlane(point, normal) {
    const randomCombination =
      AxisCombination[Math.floor(Math.random() * AxisCombination.length)];

    const randomPoint = [];
    let randomPointSum = 0;
    let missingIdx;

    for (let i = 0; i < randomCombination.length; i++) {
      if (randomCombination[i] === 0) {
        randomPoint.push(null);
        randomPointSum -= normal[i] * point[i];
        missingIdx = i;
        continue;
      }

      const randomValue = getRandomInt(5, 20);
      randomPoint.push(point[i] + randomValue);
      randomPointSum += normal[i] * randomValue;
    }

    randomPointSum *= -1 / normal[missingIdx];
    randomPoint[missingIdx] = randomPointSum;

    return randomPoint;
  }

  /**
   * @method setupKeyframes
   * Sets up the keyframes for the animation
   * @param {Integer} endTime - Animation end time
   */
  setupKeyframes(endTime) {
    this.addInitialAnimation();
    this.addMoveToPiecePosition();
    this.addMoveUpAnimation();
    this.addMoveToFinalPosition();
    this.addMoveDownAnimation();
    this.addFinalAnimation(endTime);
  }

  /**
   * @method addInitialAnimation
   * Adds the initial animation to the keyframes array
   */
  addInitialAnimation() {
    let transformation = {
      translate: [...this.startPos],
      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: 0.01,
    };

    this.keyframes.push(keyframe);
  }

  /**
   * @method addMoveToPiecePosition
   * Adds the animation to move the transporter piece to the position where it will capture the piece
   */
  addMoveToPiecePosition() {
    let transformation = {
      translate: [
        this.intermediatePos.col * 4,
        4.0,
        this.intermediatePos.row * 4,
      ],
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
   * Adds the animation to move the transporter piece up
   */
  addMoveUpAnimation() {
    const transformation = {
      translate: [
        this.intermediatePos.col * 4,
        14.0,
        this.intermediatePos.row * 4,
      ],
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
   * Adds the animation to move the transporter piece to the final position of the captured piece
   * Also adds the rotation for the transporter piece to face the captured piece
   */
  addMoveToFinalPosition() {
    const transformation = {
      translate: [this.endPos.col, 14.0, this.endPos.row],
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
   * @method addMoveDownAnimation
   * Adds the animation to move the transporter piece down to the final position of the captured piece
   * Also adds the rotation for the transporter piece to leave
   */
  addMoveDownAnimation() {
    const transformation = {
      translate: [this.endPos.col, 1.8, this.endPos.row],

      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: 2300,
    };

    this.keyframes.push(keyframe);
    super.updateTimes();
  }

  /**
   * @method addFinalAnimation
   * Adds the final animation to the keyframes array
   * @param {Integer} endTime - Animation end time
   */
  addFinalAnimation(endTime) {
    const transformation = {
      translate: [
        this.endPos.col + this.translationVect.col * 5,
        1.8,
        this.endPos.row + this.translationVect.row * 5,
      ],

      scale: [1.0, 1.0, 1.0],
      rotate: [0.0, 0.0, 0.0],
    };

    const keyframe = {
      transformation,
      instant: endTime,
    };

    this.keyframes.push(keyframe);
    super.updateTimes();
  }

  /**
   * @method update
   * Updates the animation of the transporter piece
   * @param {Integer} t - Time since last update
   * @override
   */
  update(t) {
    if (this.keyframeIndex == 1) {
      this.facing = Math.atan2(
        this.translationVect.col,
        this.translationVect.row
      );
    }
    super.update(t);
  }
}
