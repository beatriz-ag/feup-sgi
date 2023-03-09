import { CGFobject } from "../../../lib/CGF.js";

/**
 * @class MyRectangle
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 * @param {Array} x - Array of X coordinates
 * @param {Array} y - Array of Y coordinates
 */
export class MyRectangle extends CGFobject {
  constructor(scene, id, x, y) {
    super(scene);
    this.id = id;

    [this.x1, this.x2] = x;
    [this.y1, this.y2] = y;

    this.initBuffers();
  }

  /**
   * @method initBuffers
   * Initializes the rectangle buffers
   */
  initBuffers() {
    this.vertices = [
      this.x1,
      this.y1,
      0, //0
      this.x2,
      this.y1,
      0, //1
      this.x1,
      this.y2,
      0, //2
      this.x2,
      this.y2,
      0, //3
    ];

    //Counter-clockwise reference of vertices
    this.indices = [0, 1, 2, 1, 3, 2];

    //Facing Z positive
    this.normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1];

    this.texCoords = [0, 1, 1, 1, 0, 0, 1, 0];
    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * @method updateTexCoords
   * Updates the list of texture coordinates of the rectangle
   * @param {float} lenght_s - Horizontal texture length
   * @param {float} length_t - Vertical texture length
   */
  updateTexCoords(lenght_s, length_t) {
    this.texCoords = [
      0,
      (this.y2 - this.y1) / length_t,
      (this.x2 - this.x1) / lenght_s,
      (this.y2 - this.y1) / length_t,
      0,
      0,
      (this.x2 - this.x1) / lenght_s,
      0,
    ];
    this.updateTexCoordsGLBuffers();
  }
}
