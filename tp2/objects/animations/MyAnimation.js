/**
 * MyAnimation
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
    }

    /**
     * @method update
     * Abstract funtion that updates the currentTransformation attribute
     * @param {integer} t - Time since last update call
     */
    update(t) {
    }

    /**
     * @method apply
     * Applies the animation (transformation matrix) to the scene object if it active
     * @returns none
     */
    apply() {
        if (!this.active)
            return;

        this.scene.multMatrix(this.currentTransformation);
    }

    /**
     * @method isActive
     * @returns active attribute
     */
    isActive() {
        return this.active;
    }
}