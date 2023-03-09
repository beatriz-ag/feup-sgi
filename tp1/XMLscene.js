import { CGFscene } from '../lib/CGF.js';
import { CGFaxis,CGFcamera } from '../lib/CGF.js';


/**
 * XMLscene
 * @constructor
 * @param {MyInterface} myinterface  - Reference to MyInterface object
 */
export class XMLscene extends CGFscene {
    constructor(myinterface) {
        super();

        this.interface = myinterface;
    }

    /**
     * @method init
     * Initializes the scene, setting some WebGL defaults, initializing the camera and the axis
     * @param {CGFApplication} application
     */
    init(application) {
        super.init(application);

        this.sceneInited = false;

        this.initCameras();

        this.enableTextures(true);

        this.gl.clearDepth(100.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.axis = new CGFaxis(this);
        this.setUpdatePeriod(100);

        // Objects conneted to MyInterface
        this.displayAxis = false;
    }

    /**
     * @method initCameras
     * Initializes the scene cameras
     */
    initCameras() {
        this.camera = new CGFcamera(0.4, 0.1, 500, vec3.fromValues(15, 15, 15), vec3.fromValues(0, 0, 0));
    }

    /**
     * @method initLights
     * Initializes the scene lights with the values read from the XML file
     */
    initLights() {
        var i = 0;
        // Lights index.

        // Reads the lights from the scene graph.
        for (var key in this.graph.lights) {

            if (i >= 8)
                break;              // Only eight lights allowed by WebGL.

            if (this.graph.lights.hasOwnProperty(key)) {
                var light = this.graph.lights[key];

                this.lights[i].name = key;
                this.lights[i].setPosition(light[2][0], light[2][1], light[2][2], light[2][3]);
                this.lights[i].setAmbient(light[3][0], light[3][1], light[3][2], light[3][3]);
                this.lights[i].setDiffuse(light[4][0], light[4][1], light[4][2], light[4][3]);
                this.lights[i].setSpecular(light[5][0], light[5][1], light[5][2], light[5][3]);
                
                this.lights[i].setConstantAttenuation(light[6][0]);
                this.lights[i].setLinearAttenuation(light[6][1]);
                this.lights[i].setQuadraticAttenuation(light[6][2]);

                if (light[1] == "spot") {
                    this.lights[i].setSpotCutOff(light[7]);
                    this.lights[i].setSpotExponent(light[8]);
                    this.lights[i].setSpotDirection(light[9][0]-light[2][0], light[9][1]-light[2][1], light[9][2]-light[2][2]);
                }

                this.lights[i].setVisible(true);
                if (light[0]){
                    this.lights[i].enable();
                }
                else
                    this.lights[i].disable();

                this.lights[i].update();

                i++;
            }
        }

        this.interface.addLightsControls();
    }

    /**
     * @method setDefaultAppearance
     */
    setDefaultAppearance() {
        this.setAmbient(0.2, 0.4, 0.8, 1.0);
        this.setDiffuse(0.2, 0.4, 0.8, 1.0);
        this.setSpecular(0.2, 0.4, 0.8, 1.0);
        this.setShininess(10.0);
    }
    /**
     * @method onGraphLoaded
     * Handler called when the graph is finally loaded.
     * As loading is asynchronous, this may be called already after the application has started the run loop
     */
    onGraphLoaded() {
        this.axis = new CGFaxis(this, this.graph.referenceLength);

        this.gl.clearColor(this.graph.background[0], this.graph.background[1], this.graph.background[2], this.graph.background[3]);

        this.setGlobalAmbientLight(this.graph.ambient[0], this.graph.ambient[1], this.graph.ambient[2], this.graph.ambient[3]);
        
        if ((this.selectedCamera = this.graph.camera) != undefined) {
            this.cameraIds = {};
            Object.keys(this.graph.views).forEach(key => {
                this.cameraIds[key] = key;
            });

            this.updateCamera();
            this.interface.addCameraControls();
        }

        this.initLights();

        this.sceneInited = true;
    }

    /**
     * @method display
     * Displays the scene
     */
    display() {
        // ---- BEGIN Background, camera and axis setup

        // Clear image and depth buffer everytime we update the scene
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Initialize Model-View matrix as identity (no transformation
        this.updateProjectionMatrix();
        this.loadIdentity();

        // Apply transformations corresponding to the camera position relative to the origin
        this.applyViewMatrix();

        this.pushMatrix();

        if (this.displayAxis)
            this.axis.display();

        for (var i = 0; i < this.lights.length; i++) {
            this.lights[i].setVisible(true);
            this.lights[i].update();
        }

        if (this.sceneInited) {
            // Draw axis
            this.setDefaultAppearance();

            // Displays the scene (MySceneGraph function).
            this.graph.displayScene();
        }

        this.popMatrix();
        // ---- END Background, camera and axis setup
    }

    /**
     * @method update
     * Verify checked keys
     */
    update(t) {
        this.checkKeys();
    }

    /**
     * @method updateCamera
     * Update scene camera according to SceneGraph camera
     */
    updateCamera() {
        this.camera = this.graph.updateCamera(this.selectedCamera);
        this.interface.setActiveCamera(this.camera);
    }

    /**
     * @method checkKeys
     * Checked if either 'M' or 'm' keys have been pressed, and update node materials
     */
    checkKeys() {
        if (this.interface.isKeyPressed("KeyM") || this.interface.isKeyPressed("Keym")) {
            this.graph.updateMaterials(this.graph.rootNode);
        }
    }
}