import { CGFappearance, CGFshader, CGFtexture } from "../../../lib/CGF.js";
import { MyRectangle } from "../../objects/primitives/MyRectangle.js";
import { MySphere } from "../../objects/primitives/MySphere.js";

const ICONS = Object.freeze({
  Home: "!",
  Camera: "-",
  Film: "_",
  Undo: ".",
  Checker: ",",
  Satellite: ";",
  Santa: "~",
  SnowFlake: "@",
  ChritmasHat: "+",
});

/**
 * @class GameMenuView
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 */
export default class GameMenuView {
  constructor(scene) {
    this.scene = scene;
    this.appearance = new CGFappearance(this.scene);

    const texture = new CGFtexture(this.scene, "./scenes/images/font.png");
    this.appearance.setTexture(texture);
    this.textShader = new CGFshader(
      this.scene.gl,
      "./shaders/font.vert",
      "./shaders/font.frag"
    );

    this.dims = { rows: 4, cols: 23 };
    this.textShader.setUniformsValues({
      dims: [this.dims.cols, this.dims.rows],
    });

    this.rect = new MyRectangle(this.scene, "", [-0.5, 0.5], [-0.5, 0.5]);

    this.setFontDict();
    this.setThemes();
  }

  /**
   * @method setFontDict
   * Sets the font dictionary
   */
  setFontDict() {
    const letters = [
      ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    ];
    letters.push(
      ":",
      ICONS.Camera,
      ICONS.Film,
      ICONS.Undo,
      ICONS.Checker,
      ICONS.Satellite,
      ICONS.Home,
      ICONS.Santa,
      ICONS.SnowFlake,
      ICONS.ChritmasHat
    );
    this.fontDict = {};

    for (let i = 0; i < this.dims.rows; i++)
      for (let j = 0; j < this.dims.cols; j++)
        this.fontDict[letters[j + i * this.dims.cols]] = [j, i];
  }

  /**
   * @method setThemes
   * Sets the themes for the game
   */
  setThemes() {
    this.background = new MySphere(this.scene, "", 100, 60, 60);
    const spacebBackgroundMaterial = new CGFappearance(this.scene);
    spacebBackgroundMaterial.setEmission(0.5, 0.5, 0.5, 1.0);
    spacebBackgroundMaterial.setAmbient(1.0, 1.0, 1.0, 1.0);
    spacebBackgroundMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
    spacebBackgroundMaterial.setSpecular(1.0, 1.0, 1.0, 1.0);

    let texture = new CGFtexture(this.scene, "./scenes/images/stars.jpg");
    spacebBackgroundMaterial.setTexture(texture);

    const christmasBackgroundMaterial = new CGFappearance(this.scene);
    christmasBackgroundMaterial.setEmission(1.0, 1.0, 1.0, 1.0);
    christmasBackgroundMaterial.setAmbient(1.0, 1.0, 1.0, 1.0);
    christmasBackgroundMaterial.setDiffuse(1.0, 1.0, 1.0, 1.0);
    christmasBackgroundMaterial.setSpecular(1.0, 1.0, 1.0, 1.0);

    texture = new CGFtexture(this.scene, "./scenes/images/tree.png");
    christmasBackgroundMaterial.setTexture(texture);

    this.themes = {
      Space: {
        background: spacebBackgroundMaterial,
        color: [0.29, 0.4, 69, 1.0],
        disableColor: [0.29, 0.4, 69, 0.7],
      },
      Christmas: {
        background: christmasBackgroundMaterial,
        color: [1.0, 0.2, 0.2, 1.0],
        disableColor: [1.0, 0.2, 0.2, 0.7],
      },
    };
  }

  /**
   * @method getFontPosition
   * Gets the position of the letter in the font texture
   * @param {Char} letter
   * @returns {Array} - Array with the position of the letter in the font texture
   */
  getFontPosition(letter) {
    return this.fontDict[letter];
  }

  /**
   * @method setUpDisplay
   * Sets up the display for the menu hub
   */
  setUpDisplay() {
    this.scene.setActiveShaderSimple(this.textShader);
    this.scene.gl.disable(this.scene.gl.DEPTH_TEST);
    this.appearance.apply();
    this.scene.loadIdentity();
  }

  /**
   * @method resetDisplay
   * Resets the display for the menu
   */
  resetDisplay() {
    this.scene.gl.enable(this.scene.gl.DEPTH_TEST);
    this.scene.setActiveShaderSimple(this.scene.defaultShader);
    this.scene.clearPickRegistration();
  }

  /**
   * @method displayMainMenu
   * Displays the main menu according to the clicked button
   * @param {String} clickedMode
   */
  displayMainMenu(clickedMode) {
    this.theme =
      clickedMode == "Christmas" ? this.themes.Christmas : this.themes.Space;
    this.pickId = 15;

    const white = [1.0, 1.0, 1.0, 1.0];
    let spaceColor = this.theme.color;
    let christmasColor = this.theme.disableColor;

    this.displayBackground(this.theme.background);
    this.setUpDisplay();

    if (clickedMode == "Christmas") {
      spaceColor = this.theme.disableColor;
      christmasColor = this.theme.color;

      this.displayText(ICONS.SnowFlake, [27, -20, -50], [6, 6, 6], white);
      this.displayText(ICONS.SnowFlake, [-23, 7.2, -50], [12, 12, 12], white);
      this.displayText(ICONS.SnowFlake, [15, 19, -50], [6, 6, 6], white);
      this.displayText(ICONS.SnowFlake, [-18, -5, -50], [8, 8, 8], white);
      this.displayText(ICONS.SnowFlake, [-2, 30, -50], [9, 9, 9], white);
    }

    this.displayText("Checkers", [-19, 9, -50], [12, 12, 12], white);
    this.displayButton(["Play"], [-4, 0, -50], [6, 6, 6], this.theme.color);

    this.displayButton(["Space"], [-14, -8, -50], [4, 4, 4], spaceColor);
    this.displayText(ICONS.Satellite, [-16, -7.5, -50], [6, 6, 6]);

    this.displayButton(["Christmas"], [6, -8, -50], [4, 4, 4], christmasColor);
    this.displayText(ICONS.ChritmasHat, [5.5, -6.7, -50], [4, 4, 4]);

    this.resetDisplay();
  }

  /**
   * @method displayGameMenu
   * Displays the game menu information
   * @param {Array} scores - Player scores
   * @param {Array} gameTime - Current game time
   * @param {Boolean} disableButtons - If the buttons should be disabled
   */
  displayGameMenu(scores, gameTime, disableButtons) {
    this.setUpDisplay();

    this.pickId = 15;

    this.displayTime(gameTime);
    this.displayText("Blacks", [18, 19.3, -50], [4, 4, 4], this.theme.color);
    this.displayText(
      scores[0].toString(),
      [32, 19.3, -50],
      [4, 4, 4],
      this.theme.color
    );
    this.displayText("Whites", [18, 16.8, -50], [4, 4, 4], this.theme.color);
    this.displayText(
      scores[1].toString(),
      [32, 16.8, -50],
      [4, 4, 4],
      this.theme.color
    );

    if (disableButtons) {
      this.displayText(
        ICONS.Undo,
        [-27, 18.8, -50],
        [4, 4, 4],
        this.theme.disableColor
      );
      this.displayText(
        ICONS.Film,
        [-24, 18.8, -50],
        [4, 4, 4],
        this.theme.disableColor
      );
    } else {
      this.displayButton(
        [ICONS.Undo, "Undo"],
        [-27, 18.8, -50],
        [4, 4, 4],
        this.theme.color
      );
      this.displayButton(
        [ICONS.Film, "Film"],
        [-24, 18.8, -50],
        [4, 4, 4],
        this.theme.color
      );
    }
    this.displayButton(
      [ICONS.Home, "Home"],
      [-33, 18.8, -50],
      [4, 4, 4],
      this.theme.color
    );
    this.displayButton(
      [ICONS.Camera, "Camera"],
      [-30, 18.8, -50],
      [4, 4, 4],
      this.theme.color
    );

    this.resetDisplay();
  }

  /**
   * @method displayGameOverMenu
   * Displays the game over menu according to selected theme
   * @param {Integer} winner - Winner player id
   */
  displayGameOverMenu(winner) {
    this.displayBackground(this.theme.background);
    this.setUpDisplay();

    const winnerText = winner ? "Whites" : "Blacks";
    this.displayText(
      winnerText,
      [-14, 10, -50],
      [12, 12, 12],
      this.theme.color
    );
    this.displayText("WIN", [-4, 2, -50], [12, 12, 12], this.theme.color);
    this.displayButton(
      [ICONS.Home, "Home"],
      [20, -10, -50],
      [4, 4, 4],
      this.theme.color
    );
    this.displayText("Menu", [11, -9, -50], [4, 4, 4], this.theme.color);
    this.resetDisplay();
  }

  /**
   * @method displayTime
   * Displays the time in the game menu
   * @param {Array} gameTime - Current game time
   */
  displayTime(gameTime) {
    const white = [1.0, 1.0, 1.0, 1.0];

    const minute = gameTime[0];
    let seconds = gameTime[1];
    if (seconds.length > 1) seconds = gameTime[1].split("");
    else seconds = ["0", seconds];

    this.displayText("0", [-8, 18.9, -50], [4, 4, 4], white);
    this.displayText(minute, [-5, 18.9, -50], [4, 4, 4], white);
    this.displayText(":", [-3, 18.9, -50], [4, 4, 4], white);
    this.displayText(seconds[0], [-1, 18.9, -50], [4, 4, 4], white);
    this.displayText(seconds[1], [2, 18.9, -50], [4, 4, 4], white);
  }

  /**
   * @method displayBackground
   * Displays the background according to selected theme
   * @param {CGFappearance} material
   */
  displayBackground(material) {
    this.scene.pushMatrix();

    this.scene.scale(-1, -1, -1);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);

    material.apply();
    this.background.display();

    this.scene.popMatrix();
  }

  /**
   * @method displayButton
   * Displays a button with text and a pickable area
   * @param {Array} text - Button text
   * @param {Object} position - Button position
   * @param {Array} scale - Scale of the button
   * @param {Array} displayColor - Display color
   */
  displayButton(text, position, scale, displayColor) {
    const button = text.length > 1 ? text[1] : text[0];

    this.scene.registerForPick(this.pickId++, { button });
    this.displayText(text[0], position, scale, displayColor);
  }

  /**
   * @method displayText
   * Displays a string of text
   * @param {String} text - Text to display
   * @param {Object} position - Position of the text
   * @param {Array} scale - Text scale
   * @param {Array} displayColor - Text color
   */
  displayText(text, position, scale, displayColor = null) {
    this.scene.pushMatrix();
    this.scene.translate(...position);

    for (let i = 0; i < text.length; i++) {
      const charCoords = this.getFontPosition(text[i]);
      if (displayColor == null)
        this.scene.activeShader.setUniformsValues({
          charCoords,
          keepColor: true,
        });
      else
        this.scene.activeShader.setUniformsValues({
          charCoords,
          displayColor,
          keepColor: false,
        });

      this.scene.pushMatrix();

      this.scene.scale(...scale);
      this.scene.translate(i * 0.5, 0, 0);
      this.rect.display();

      this.scene.popMatrix();
    }

    this.scene.popMatrix();
  }
}
