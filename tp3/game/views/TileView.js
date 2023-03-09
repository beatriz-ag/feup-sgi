import { CGFplane, CGFappearance, CGFtexture } from "../../../lib/CGF.js";

/**
 * @class TileView
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 */
export default class TileView {
  constructor(scene) {
    this.scene = scene;
    this.tile = new CGFplane(scene);
    const texture = new CGFtexture(this.scene, "./scenes/images/highlight.jpg");

    this.whiteMaterial = new CGFappearance(scene);
    this.whiteMaterial.setAmbient(1.0, 1.0, 1.0, 1);
    this.whiteMaterial.setDiffuse(1.0, 1.0, 1.0, 1);
    this.whiteMaterial.setSpecular(1.0, 1.0, 1.0, 1);
    this.whiteMaterial.setShininess(120);

    this.blackMaterial = new CGFappearance(scene);
    this.blackMaterial.setAmbient(0.0, 0.0, 0.0, 1);
    this.blackMaterial.setDiffuse(0.05, 0.05, 0.05, 1);
    this.blackMaterial.setSpecular(0.05, 0.05, 0.05, 1);
    this.blackMaterial.setShininess(120);

    this.highlightedMaterial = new CGFappearance(scene);
    this.highlightedMaterial.setEmission(0.5, 0.5, 0.5, 1);
    this.highlightedMaterial.setAmbient(0.66, 0.89, 0.89, 1);
    this.highlightedMaterial.setDiffuse(0.3, 0.3, 0.3, 1);
    this.highlightedMaterial.setSpecular(0.5, 0.0, 0.0, 1);
    this.highlightedMaterial.setShininess(499);
    this.highlightedMaterial.setTexture(texture);

    this.movableMaterial = new CGFappearance(scene);
    this.highlightedMaterial.setEmission(0.5, 0.5, 0.5, 1);
    this.movableMaterial.setAmbient(0.89, 0.66, 0.89, 1);
    this.movableMaterial.setDiffuse(0.3, 0.3, 0.3, 1);
    this.movableMaterial.setSpecular(0.5, 0.0, 0.0, 1);
    this.movableMaterial.setShininess(120);
  }

  /**
   * @method display
   * Displays the tile at a given position
   * @param {Integer} row - Tile row
   * @param {Integer} col - Tile column
   * @param {Boolean} highlight - If the tile should be highlighted
   */
  display(row, col, highlight = false) {
    this.scene.pushMatrix();

    this.scene.scale(4, 1, 4);
    this.scene.translate(col, 0.2, row);

    if (highlight) {
      this.highlightedMaterial.apply();
    } else if ((row + col) % 2 != 0) {
      this.blackMaterial.apply();
    } else {
      this.whiteMaterial.apply();
    }

    this.tile.display();
    this.scene.popMatrix();
  }
}
