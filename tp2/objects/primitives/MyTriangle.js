import { CGFobject } from '../../../lib/CGF.js';

/**
 * MyTriangle
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id -  Object identifier
 * @param {Array} x - Array of X coordinates
 * @param {Array} y - Array of Y coordinates
 * @param {Array} z - Array of Z coordinates
 */
export class MyTriangle extends CGFobject {
    constructor(scene, id, x, y, z) {
        super(scene);
        this.id = id;

        [this.x1, this.x2, this.x3] = x;
        [this.y1, this.y2, this.y3] = y;
        [this.z1, this.z2, this.z3] = z;

        this.v1_v2 = Math.sqrt(Math.pow(this.x2 - this.x1, 2) + Math.pow(this.y2 - this.y1, 2));
        this.v2_v3 = Math.sqrt(Math.pow(this.x3 - this.x2, 2) + Math.pow(this.y3 - this.y2, 2));
        this.v3_v1 = Math.sqrt(Math.pow(this.x1 - this.x3, 2) + Math.pow(this.y1 - this.y3, 2));

        this.cosv1_v2 = (Math.pow(this.v1_v2, 2) - Math.pow(this.v2_v3, 2) + Math.pow(this.v3_v1, 2)) / (2 * this.v1_v2 * this.v3_v1);
        this.sinv1_v2 = Math.sqrt(1 - Math.pow(this.cosv1_v2, 2));

        this.initBuffers();
    }

    /**
     * @method initBuffers
     * Initializes the triangle buffers
     */
    initBuffers() {
        this.vertices = [
            this.x1, this.y1, this.z1,	  //0
            this.x2, this.y2, this.z2,	  //1
            this.x3, this.y3, this.z3,	  //2
        ];

        //Counter-clockwise reference of vertices
        this.indices = [
            0, 1, 2,
        ];

        this.normals = [];

        var normalVec = [];
        vec3.cross(normalVec, [this.x2 - this.x1, this.y2 - this.y1, this.z2 - this.z1], [this.x3 - this.x1, this.y3 - this.y1, this.z3 - this.z1]);

        var vSize = Math.sqrt(normalVec[0] * normalVec[0] + normalVec[1] * normalVec[1] + normalVec[2] * normalVec[2]);

        normalVec = normalVec.map(x => x / vSize)

        for (var i = 0; i < 3; i++) {
            this.normals.push(...normalVec);
        }

        this.texCoords = [
            0, 1,
            this.v1_v2, 1,
            this.v3_v1 * this.cosv1_v2, 1 - this.v3_v1 * this.sinv1_v2,
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    /**
    * @method updateTexCoords
    * Updates the list of texture coordinates of the triangle
    * @param {float} length_s - Horizontal texture length
    * @param {float} length_t - Vertical texture length
    */
    updateTexCoords(length_s, length_t) {
        this.texCoords = [
            0, 1,
            this.v1_v2 / length_s, 1,
            this.v3_v1 * this.cosv1_v2 / length_s, 1 - this.v3_v1 * this.sinv1_v2 / length_t,
        ];
        this.updateTexCoordsGLBuffers();
    }

}
