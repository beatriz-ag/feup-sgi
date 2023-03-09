import { CGFobject } from '../../../lib/CGF.js';

/**
 * MyTorus
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 * @param {float} inner - The "tube" radius
 * @param {float} outer - The circular axis radius
 * @param {integer} slices - Number of divisions around the "tube" axis
 * @param {integer} loops - Number of divisions around the object
 */
export class MyTorus extends CGFobject {
    constructor(scene, id, inner, outer, slices, loops) {
        super(scene);
        this.id = id;

        this.inner = inner;
        this.outer = outer;
        this.slices = slices;
        this.loops = loops;

        this.initBuffers();
    }

    /**
     * @method initBuffers
     * Initializes the torus buffers
     */
    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        var phi = 0;
        var phiInc = (2 * Math.PI) / this.loops;

        var theta = 0;
        var thetaInc = (2 * Math.PI) / this.slices;

        for (var slice = 0; slice <= this.slices; slice++) {
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);

            phi = 0;
            for (var loop = 0; loop <= this.loops; loop++) {
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);

                //   x=(R+r·cos(v))cos(w)
                //   y=(R+r·cos(v))sin(w)
                //             z=r.sin(v)
                var x = (this.outer + (this.inner * cosTheta)) * cosPhi;
                var y = (this.outer + (this.inner * cosTheta)) * sinPhi
                var z = this.inner * sinTheta;
                var s = 1 - (slice / this.slices);
                var t = 1 - (loop / this.loops);

                this.vertices.push(x, y, z);
                this.normals.push(
                    cosPhi * cosTheta,
                    sinPhi * cosTheta,
                    sinTheta);
                this.texCoords.push(s, t);

                phi += phiInc;
            }

            theta += thetaInc;
        }

        for (var slice = 0; slice < this.slices; slice++) {
            for (var loop = 0; loop < this.loops; loop++) {
                var first = (slice * (this.loops + 1)) + loop;
                var second = first + this.loops + 1;

                this.indices.push(first, second + 1, second);
                this.indices.push(first, first + 1, second + 1);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    /**
    * @method updateTexCoords
    * Updates the list of texture coordinates of the torus
    * @param {Array} coords - Array of texture coordinates
    */
    updateTexCoords(coords) {
    }
}
