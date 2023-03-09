import { MyCylinder } from "../../objects/primitives/MyCylinder.js";
import { MyRectangle } from "../../objects/primitives/MyRectangle.js";
import { CGFappearance, CGFtexture } from "../../../lib/CGF.js";
import TileView from "./TileView.js";
import PieceView from "./PieceView.js";

/**
 * @class GameBoardView
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 * @param {GameBoard} gameBoard - Reference to GameBoard object
 * @param {String} themeTexture - Texture of the game board
 */
export default class GameBoardView {
  constructor(scene, gameBoard, themeTexture) {
    this.scene = scene;
    this.gameBoard = gameBoard;

    // Views
    this.tilesViewer = new TileView(scene);
    this.piecesViewer = new PieceView(scene);

    // GameBoard parts
    this.baseBorders = new MyCylinder(scene, "", 25.456, 25.456, 2, 4, 1);
    this.baseBottom = new MyRectangle(scene, "", [-4, 32], [-4, 32]);

    this.setMaterial(themeTexture);
  }

  /**
   * @method setMaterial
   * Sets the material of the game board
   * @param {String} themeTexture - Texture of the game board
   */
  setMaterial(themeTexture) {
    const texture = new CGFtexture(
      this.scene,
      `./scenes/images/${themeTexture}`
    );

    this.material = new CGFappearance(this.scene);
    this.material.setEmission(0.7, 0.7, 0.7, 1);
    this.material.setAmbient(0.05, 0.05, 0.05, 1);
    this.material.setDiffuse(0.05, 0.05, 0.05, 1);
    this.material.setSpecular(0.05, 0.05, 0.05, 1);
    this.material.setShininess(120);
    this.material.setTexture(texture);
  }

  /**
   * @method display
   * Displays the game boards
   * @param {Boolean} canClick - If the game board can be clicked
   * @param {Object} clickedPos - Position of the clicked tile
   */
  display(canClick, clickedPos = null) {
    this.displayMainBoard();
    this.displayAuxiliarBoard();
    this.displayCells(canClick, clickedPos);
  }

  /**
   * @method displayMainBoard
   * Displays the main game board
   */
  displayMainBoard() {
    // Display borders
    this.scene.pushMatrix();

    this.scene.translate(14, 0, 14);
    this.displayBoard();

    this.scene.popMatrix();

    // Display bottom base
    this.scene.pushMatrix();

    this.scene.translate(0, -2, 0);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBottom.display();

    this.scene.popMatrix();

    // Display top
    this.scene.pushMatrix();

    this.scene.translate(0, 0, 28);
    this.scene.rotate(-Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBottom.display();

    this.scene.popMatrix();
  }

  /**
   * @method displayBoard
   * Displays the borders of the game board
   */
  displayBoard() {
    this.scene.pushMatrix();

    this.scene.rotate(Math.PI / 4, 0, 1, 0);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBorders.display();

    this.scene.popMatrix();
  }

  /**
   * @method displayAuxiliarBoard
   * Displays the auxiliar game board
   */
  displayAuxiliarBoard() {
    this.displayAuxiliarBoardOutside();
    this.displayAuxiliarBoardInside();
    this.displayAuxiliarBoardPieces();
  }

  /**
   * @method displayAuxiliarBoardOutside
   * Displays the outside of the auxiliar game board
   */
  displayAuxiliarBoardOutside() {
    this.scene.pushMatrix();

    this.scene.translate(38, 0, 14);
    this.scene.scale(3 / 9, 1, 1);
    this.displayBoard();

    this.scene.popMatrix();

    // Display bottom base
    this.scene.pushMatrix();

    this.scene.translate(38, -2, 0);
    this.scene.scale(3 / 9, 1, 1);
    this.scene.translate(-14, 0, 0);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBottom.display();

    this.scene.popMatrix();
  }

  /**
   * @method displayAuxiliarBoardInside
   * Displays the inside of the auxiliar game board
   */
  displayAuxiliarBoardInside() {
    // Display borders
    this.scene.pushMatrix();

    this.scene.translate(38, -2, 14);
    this.scene.scale(3 / 9, 1, 1);
    this.scene.scale(1, -1, 1);
    this.scene.rotate(Math.PI / 4, 0, 1, 0);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBorders.display();

    this.scene.popMatrix();

    // Display base top
    this.scene.pushMatrix();

    this.scene.translate(38, -2, 0);
    this.scene.scale(3 / 9, 1, 1);
    this.scene.translate(14, 0, 0);
    this.scene.scale(-1, 1, 1);
    this.scene.rotate(Math.PI / 2, 1, 0, 0);
    this.material.apply();
    this.baseBottom.display();

    this.scene.popMatrix();
  }

  /**
   * @method displayCells
   * Displays the cells of the game board and the pieces on them
   * @param {Boolean} canClick - If the game board can be clicked
   * @param {Object} clickedPos - Position of the clicked tile
   */
  displayCells(canClick, clickedPos) {
    const [clicablePositions, nonClickablePositions] =
      this.gameBoard.filterClicablePositions(clickedPos, canClick);
    let pickId = 1;

    for (let pos of nonClickablePositions) {
      pos = JSON.parse(pos);
      this.tilesViewer.display(pos.row, pos.col);
      this.displayPiece(pos);
    }

    for (const pos of clicablePositions) {
      this.scene.registerForPick(pickId++, pos);
      this.tilesViewer.display(pos.row, pos.col, true);
      this.displayPiece(pos);
    }
    this.scene.clearPickRegistration();
  }

  /**
   * @method displayAuxiliarBoardPieces
   * Displays the pieces on the auxiliar game board
   */
  displayAuxiliarBoardPieces() {
    const auxiliarBoard = this.gameBoard.auxiliarBoard;

    for (let i = 0; i < auxiliarBoard.length; i++)
      for (let j = 0; j < auxiliarBoard[1].length; j++)
        this.displayAuxiliarBoardPiece(i, j);
  }

  /**
   * @method displayPiece
   * Displays a piece on the game board
   * @param {Object} pos - Position of the piece
   */
  displayPiece(pos) {
    const piece = this.gameBoard.getPlayerPiece(pos);

    if (piece == null) return;
    this.piecesViewer.display(pos, piece);
  }

  /**
   * @method displayAuxiliarBoardPiece
   * Displays a piece on the auxiliar game board
   * @param {Integer} row - Row of the piece
   * @param {Integer} col - Column of the piece
   */
  displayAuxiliarBoardPiece(row, col) {
    const piece = this.gameBoard.getAuxiliarBoardPiece({ row, col });

    if (piece == null) return;
    this.piecesViewer.display({ row, col: col + 8, height: -0.5 }, piece, 2);
  }
}
