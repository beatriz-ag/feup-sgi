import { CGFobject } from "../../../lib/CGF.js";

/**
 * @class MySphere
 * @method constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 * @param {float} radius - Sphere radius
 * @param {integer} slices - Number of slices around Y axis
 * @param {integer} stacks - Number of stacks along Y axis, from the center to the poles (half of sphere)
 */
export class MySphere extends CGFobject {
  constructor(scene, id, radius, slices, stacks) {
    super(scene);
    this.id = id;
    this.radius = radius;
    this.latDivs = stacks * 2;
    this.longDivs = slices;

    this.initBuffers();
  }

  /**
   * @method initBuffers
   * Initializes the sphere buffers
   */
  initBuffers() {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.texCoords = [];

    var phi = 0;
    var theta = 0;
    var phiInc = Math.PI / this.latDivs;
    var thetaInc = (2 * Math.PI) / this.longDivs;
    var latVertices = this.longDivs + 1;
    var longInc = 1 / this.longDivs;
    var latInc = 1 / this.latDivs;

    // build an all-around stack at a time, starting on "north pole" and proceeding "south"
    for (let latitude = 0; latitude <= this.latDivs; latitude++) {
      var sinPhi = Math.sin(phi); //phi=15 -> sen(phi)=0.2588
      var cosPhi = Math.cos(phi); //phi 15 -> cos = 0.96

      // in each stack, build all the slices around, starting on longitude 0
      theta = 0;
      for (let longitude = 0; longitude <= this.longDivs; longitude++) {
        //--- Vertices coordinates
        var x = Math.cos(theta) * sinPhi * this.radius;
        var y = Math.sin(-theta) * sinPhi * this.radius;
        var z = cosPhi * this.radius;
        this.vertices.push(x, y, z);

        //--- Indices
        if (latitude < this.latDivs && longitude < this.longDivs) {
          var current = latitude * latVertices + longitude;
          var next = current + latVertices;
          // pushing two triangles using indices from this round (current, current+1)
          // and the ones directly south (next, next+1)
          // (i.e. one full round of slices ahead)

          this.indices.push(current + 1, next, current);
          this.indices.push(current + 1, next + 1, next);
        }

        const distance = Math.sqrt(
          Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2)
        );
        this.normals.push(x / distance, y / distance, z / distance);
        theta += thetaInc;

        //--- Texture Coordinates
        this.texCoords.push(-longitude * longInc, latitude * latInc);
      }
      phi += phiInc;
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  /**
   * @method updateTexCoords
   * Updates the list of texture coordinates of the sphere
   * @param {Array} coords - Array of texture coordinates
   */
  updateTexCoords(coords) {}
}
