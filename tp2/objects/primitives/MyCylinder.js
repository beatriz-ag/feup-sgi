import { CGFobject } from '../../../lib/CGF.js';

/**
 * MyCylinder
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 * @param {float} baseRadius - Cylinder base radius 
 * @param {float} topRadius - Cylinder top radius
 * @param {float} height - Cylinder height
 * @param {integer} slices - Rotation divisions
 * @param {integer} stacks - Height divisions
 */
export class MyCylinder extends CGFobject {
    constructor(scene, id, baseRadius, topRadius, height, slices, stacks) {
        super(scene);
        this.id = id;

        this.baseRadius = baseRadius;
        this.topRadius = topRadius;
        this.height = height;
        this.slices = slices;
        this.stacks = stacks;

        this.initBuffers();
    }

    /**
     * @method initBuffers
     * Initializes the cylinder buffers
     */
    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        const alphaAng = 2 * Math.PI / this.slices;
        const incrementHeight = this.height / this.stacks;
        const incrementRadius = (this.topRadius - this.baseRadius) / this.stacks;
        const normalZ = Math.sin(Math.atan(this.baseRadius - this.topRadius) / this.height);

        var radius = this.baseRadius;
        var height = 0;

        for (var stack = 0; stack <= this.stacks; stack++) {
            for (var slice = 0; slice <= this.slices; slice++) {
                var xAng = Math.cos(alphaAng * slice) * radius;
                var yAng = Math.sin(alphaAng * slice) * radius;
                var vSize = Math.sqrt(xAng * xAng + yAng * yAng + normalZ * normalZ);

                this.vertices.push(xAng, yAng, height);

                this.normals.push(xAng / vSize, yAng / vSize, normalZ / vSize);

                this.texCoords.push(slice / this.slices, 1 - (stack / this.stacks));
            }
            radius += incrementRadius;
            height += incrementHeight;
        }

        for (var stack = 0; stack < this.stacks; stack++) {
            for (var slice = 0; slice < this.slices; slice++) {
                var ind1 = slice + stack * (this.slices + 1);
                var ind2 = slice + stack * (this.slices + 1) + 1;
                var ind3 = slice + (stack + 1) * (this.slices + 1);
                var ind4 = slice + (stack + 1) * (this.slices + 1) + 1;
                this.indices.push(ind4, ind3, ind1);
                this.indices.push(ind1, ind2, ind4);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    /**
     * @method updateTexCoords
     * Updates the list of texture coordinates of the cylinder
     * @param {Array} coords - Array of texture coordinates
     */
    updateTexCoords(coords) {
    }

}
