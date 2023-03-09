/**
 * @class TransporterView
 * Creates a transporter view
 * @param {XMLscene} scene - Reference to MyScene object
 * @param {String} component - Scene component ID
 */
export default class TransporterView {
  constructor(scene, component) {
    this.scene = scene;
    this.component = component;
  }

  /**
   * @method display
   * Displays the transporter at a given angle
   * @param {Integer} angle - Rotation angle in radians
   */
  display(angle) {
    let node = this.scene.graph.components[this.component];
    this.scene.pushMatrix();

    this.scene.translate(-1, 0, 0);
    this.scene.rotate(angle, 0, 1, 0);
    this.scene.graph.processNode(node, null, null);

    this.scene.popMatrix();
  }
}
