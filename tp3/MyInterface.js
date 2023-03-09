import { CGFinterface, CGFapplication, dat } from "../lib/CGF.js";

/**
 * @class MyInterface
 * @constructor
 */
export class MyInterface extends CGFinterface {
  constructor() {
    super();
  }

  /**
   * @method init
   * Initializes the interface
   * @param {CGFapplication} application
   */
  init(application) {
    super.init(application);
    // init GUI. For more information on the methods, check:
    //  http://workshop.chromeexperiments.com/examples/gui

    this.gui = new dat.GUI();
    this.gui.hide();

    // add a group of controls (and open/expand by defult)

    this.initKeys();

    return true;
  }

  /**
   * @method initKeys
   * Creates keyboard processor
   */
  initKeys() {
    this.scene.gui = this;
    this.processKeyboard = function () {};
    this.activeKeys = {};
  }

  /**
   * @method processKeyDown
   * Processes a press event
   * @param event
   */
  processKeyDown(event) {
    this.activeKeys[event.code] = true;
  }

  /**
   * @method processKeyUp
   * Processes a release event
   * @param event
   */
  processKeyUp(event) {
    this.activeKeys[event.code] = false;
  }

  /**
   * @method isKeyPressed
   * Checks if a certain key is pressed
   * @param {String} keyCode
   * @return true if key is pressed, otherwise false
   */
  isKeyPressed(keyCode) {
    return this.activeKeys[keyCode];
  }

  /**
   * @method addCameraControls
   * Adds cameras folder
   */
  addCameraControls() {
    var camerasFolder = this.gui.addFolder("Cameras");
    camerasFolder
      .add(this.scene, "selectedCamera", this.scene.cameraIds)
      .name("Camera")
      .onChange(() => this.scene.updateCamera());
  }

  /**
   * @method addLightsControls
   * Adds lights folder
   */
  addLightsControls() {
    var lightsFolder = this.gui.addFolder("Lights");
    for (const light of this.scene.lights) {
      if (light.name == undefined) continue;

      lightsFolder
        .add(light, "enabled")
        .name(light.name)
        .onChange(() => light.update());
    }
  }

  /**
   * @method addShadersControls
   * Adds shaders folder
   */
  addShadersControls() {
    var shadersFolder = this.gui.addFolder("Shaders");
    for (const component of this.scene.shaderComponents) {
      shadersFolder
        .add(this.scene.graph.components[component].shader, "enabled")
        .name(component);
    }
  }
}
