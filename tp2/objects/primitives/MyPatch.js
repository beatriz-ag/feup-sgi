import { CGFnurbsObject, CGFnurbsSurface } from '../../../lib/CGF.js';

/**
 * MyPatch
 * @constructor
 * @param {CGFscene} scene - Reference to XMLscene object
 * @param {String} id - Object identifier
 * @param {integer} degree1 - Degree in U
 * @param {integer} degree2 - Degree in V
 * @param {integer} uDivs - Number of divisions in the U axis
 * @param {integer} vDivs - Number of divisions in the V axis
 * @param {Array} controlPoints - List of control points, divided by U and V
 */
export class MyPatch {
    constructor(scene, id, degree1, degree2, uDivs, vDivs, controlPoints) {
        this.id = id;

        // an object holding the surface representation and having a function getPoint(u, v)
        var nurbsSurface = new CGFnurbsSurface(degree1, degree2, controlPoints);

        // generate a 3D object with uDivsxvDivs vertexes based on a surface representation
        this.obj = new CGFnurbsObject(scene, uDivs, vDivs, nurbsSurface);

        this.obj.initBuffers();
    }

    /**
     * @method display
     * Display nurb object
     */
    display() {
        this.obj.display();
    }

    /**
     * @method updateTexCoords
     * Updates the list of texture coordinates of the MyPatch's object
     * @param {Array} coords - Array of texture coordinates
     */
    updateTexCoords(coords) {
    }
}