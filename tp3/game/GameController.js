import GameBoard from "./models/GameBoard.js";
import GameBoardView from "./views/GameBoardView.js";
import { MySceneGraph } from "../MySceneGraph.js";
import GameAnimator from "./GameAnimator.js";
import GameCamera from "./GameCamera.js";
import GameLight from "./GameLight.js";
import GameMenuView from "./views/GameMenuView.js";
import * as Utils from "./GameUtils.js";
import GameSequences from "./models/GameSequences.js";
import { MyPieceAnimation } from "../objects/animations/MyPieceAnimation.js";
import { MyEvolutionAnimation } from "../objects/animations/MyEvolutionAnimation.js";

const STATES = Object.freeze({
  Menu: 0,
  PickPiece: 1,
  PickMove: 2,
  MovePiece: 3,
  Undo: 4,
  Film: 5,
  GameOver: 6,
});

const PlayerIdx = Object.freeze({
  Player1: 0,
  Player2: 1,
});

const TurnTime = 300000; // 5 min in miliseconds

/**
 * @class GameController
 * @classdesc Class that controls the game flow
 * @constructor
 * @param {XMLscene} scene - Reference to MyScene object
 */
export default class GameController {
  constructor(scene) {
    this.scene = scene;

    this.gameState = STATES.Menu;
    this.camera = new GameCamera(scene.camera);
    this.light = new GameLight(scene);
    this.animator = new GameAnimator(scene);
    this.menuViewer = new GameMenuView(scene);
    this.gameSequences = new GameSequences();
    this.gameSettings = "Space";
  }

  /**
   * @method startGame
   * Starts a new game
   */
  startGame() {
    this.playerTurn = PlayerIdx.Player1;
    this.gameTime = TurnTime;
    this.pickedPiece = null;
    this.pickedMove = null;
    this.mandatoryPlay = null;

    this.scores = [0, 0];

    this.gameSettings = this.initSettings();
    this.startMusic();
    this.audio = this.gameSettings.audio;

    this.theme = new MySceneGraph(this.gameSettings.theme, this.scene);

    this.gameBoard = new GameBoard(
      this.scene,
      this.gameSettings.pieceSizeFactor
    );
    this.gameBoardViewer = new GameBoardView(
      this.scene,
      this.gameBoard,
      this.gameSettings.textureBoard
    );

    this.animator.setViewers(
      this.gameBoardViewer,
      this.gameSettings.transporter
    );
    this.camera.resetPosition();

    this.gameBoard.setValidMoves(this.playerTurn);
    this.changeState(STATES.PickPiece);
  }

  /**
   * @method initSettings
   * Initializes the game settings
   * @returns {Object} - The game settings
   */
  initSettings() {
    const christmasAudio = new Audio("scenes/music/christmas.mp3");
    const spaceAudio = new Audio("scenes/music/space.mp3");

    const settings = {
      Space: {
        theme: "space.xml",
        pieceSizeFactor: 6.4,
        transporter: "spaceship",
        textureBoard: "granit.jpg",
        audio: spaceAudio,
      },
      Christmas: {
        theme: "christmas.xml",
        pieceSizeFactor: 5,
        transporter: "sled",
        textureBoard: "christmas.jpg",
        audio: christmasAudio,
      },
    };
    return settings[this.gameSettings];
  }

  /**
   * @method startMusic
   * Starts the game music
   */
  startMusic() {
    const audio = this.gameSettings.audio;
    audio.loop = true;
    audio.volume = 0.3;
    audio.play();
  }

  /**
   * @method update
   * Updates the game
   * @param {Integer} time - the time elapsed since the last update
   */
  update(time) {
    this.animator.update(time);
    this.camera.update(time);
    this.light.update(time);

    if ([STATES.PickPiece, STATES.PickMove].includes(this.gameState)) {
      this.gameTime -= time;
    }
  }

  /**
   * @method manage
   * Manages the game according to the current state
   */
  manage() {
    const click = this.clicked();

    if (this.gameState == STATES.Menu) {
      this.menuHandler(click);
      return;
    }

    if (this.gameState == STATES.GameOver) {
      this.gameOverHandler(click);
      return;
    }

    this.animator.manage();
    const handledClick = this.clickHandler(click);

    if (this.gameState == STATES.MovePiece) {
      this.movePieceHandler();
      return;
    }

    if (this.gameState == STATES.Undo) {
      this.undoHandler();
      return;
    }

    if (this.gameState == STATES.Film) {
      this.filmHandler();
      return;
    }

    this.verifyEndGame();

    if (handledClick) return;

    if (this.gameState == STATES.PickMove) {
      this.pickMoveHandler(click);
      return;
    }

    if (this.gameState == STATES.PickPiece) {
      this.pickPieceHandler(click);
      return;
    }
  }

  /**
   * @method menuHandler
   * Handles the menu state
   * @param {Object} clickedButton - Clicked button
   */
  menuHandler(clickedButton) {
    if (clickedButton == null) return;

    const { button } = clickedButton;
    if (button == "Play") {
      this.startGame();
      return;
    }
    this.gameSettings = button;
  }

  /**
   * @method gameOverHandler
   * Handles the game over state
   * @param {Object} clickedButton - Clicked button
   */
  gameOverHandler(clickedButton) {
    if (clickedButton == null) return;

    const { button } = clickedButton;
    if (button == "Home") {
      this.resetGame();
      return;
    }
  }

  /**
   * @method pickPieceHandler
   * Handles the pick piece state
   * @param {Object} clickedPos - Clicked position
   */
  pickPieceHandler(clickedPos) {
    this.pickedPiece = { row: clickedPos.row, col: clickedPos.col };
    this.changeState(STATES.PickMove);
  }

  /**
   * @method pickMoveHandler
   * Handles the pick move state
   * @param {Object} clickedPos - Clicked position
   */
  pickMoveHandler(clickedPos) {
    const { row, col, isMovement } = clickedPos;

    // Reset clicked position
    if (this.pickedPiece.row == row && this.pickedPiece.col == col) {
      this.pickedPiece = null;
      this.changeState(STATES.PickPiece);
      return;
    }

    // Check other move conditions
    if (!isMovement) {
      this.pickedPiece = { row, col };
      return;
    }

    // Move piece
    this.pickedMove = { row, col };
    this.setupPieceAnimations();
  }

  /**
   * @method movePieceHandler
   * Handles the move piece state
   */
  movePieceHandler() {
    if (this.animator.hasAnimations()) return;

    this.gameBoard.executeMove(
      this.currentPieceID,
      this.playerTurn,
      this.pickedMove
    );

    this.pickedPiece = null;

    if (!this.gameBoard.capturing) {
      this.switchTurns();
      return;
    }

    this.gameBoard.fillAuxiliarBoard(this.playerTurn, this.intermediatePieceID);

    this.scores[this.playerTurn]++;

    this.gameBoard.setValidMoves(this.playerTurn, this.pickedMove);
    this.changeState(STATES.PickPiece);

    this.currentPieceID = null;
    this.intermediatePieceID = null;
    this.mandatoryPlay = { ...this.pickedMove };
  }

  /**
   * @method undoHandler
   * Handles the undo state
   */
  undoHandler() {
    if (this.animator.hasAnimations()) return;

    const { playerTurn, board, auxiliarBoard, scores, mandatoryPlay } =
      this.previousSequence;

    this.gameBoard.setBoard(board);
    this.gameBoard.setAuxiliarBoard(auxiliarBoard);
    this.scores = scores;
    this.changePlayer(playerTurn);

    this.pickedPiece = null;
    this.gameBoard.setValidMoves(this.playerTurn, mandatoryPlay);
    this.mandatoryPlay = null;
    this.changeState(STATES.PickPiece);
  }

  /**
   * @method filmHandler
   * Handles the film state
   */
  filmHandler() {
    if (this.animator.hasAnimations()) return;

    const sequence = this.gameSequences.getSequence(this.filmSequence);
    if (sequence == null) {
      this.gameBoard.setBoard(this.finalBoards.board);
      this.gameBoard.setAuxiliarBoard(this.finalBoards.auxiliarBoard);
      this.finalBoards = null;
      this.changeState(STATES.PickPiece);
      return;
    }

    const { moves, board, auxiliarBoard } = sequence;
    this.gameBoard.setBoard(board, true);
    this.gameBoard.setAuxiliarBoard(auxiliarBoard, true);

    for (const animation of moves) {
      animation.reset();
      if (animation instanceof MyPieceAnimation) {
        this.animator.addPieceAnimation(animation);
        this.gameBoard.emptyPosition(animation.startPos);
      } else if (animation instanceof MyEvolutionAnimation)
        this.animator.setEvolutionAnimation(animation);
      else this.animator.setCaptureAnimation(animation);
    }

    this.filmSequence++;
  }

  /**
   * @method verifyEndGame
   * Verifies if the game has ended
   */
  verifyEndGame() {
    // Time out
    if (this.gameTime <= 0) {
      this.winner = 1 - this.playerTurn;
      this.changeState(STATES.GameOver);
      return;
    }

    // Verify scores
    if (this.scores[PlayerIdx.Player1] == 12) {
      this.winner = PlayerIdx.Player1;
      this.changeState(STATES.GameOver);
      return;
    }
    if (this.scores[PlayerIdx.Player2] == 12) {
      this.winner = PlayerIdx.Player2;
      this.changeState(STATES.GameOver);
      return;
    }

    // Verify if there are no more moves for current player
    if (!this.gameBoard.existMoves()) {
      if (this.pickedMove == null) {
        this.winner = 1 - this.playerTurn;
        this.changeState(STATES.GameOver);
        return;
      }

      this.switchTurns();
    }
  }

  /**
   * @method display
   * Displays the game according to the current state
   */
  display() {
    if (this.gameState == STATES.Menu) {
      this.menuViewer.displayMainMenu(this.gameSettings);
      return;
    }

    if (this.gameState == STATES.GameOver) {
      this.menuViewer.displayGameOverMenu(this.winner);
      return;
    }

    const canClick = ![STATES.MovePiece, STATES.Undo, STATES.Film].includes(
      this.gameState
    );

    if (this.scene.sceneInited) {
      this.gameBoardViewer.display(canClick, this.pickedPiece);
      this.theme.displayScene();
    }
    const disableButtons = [
      STATES.MovePiece,
      STATES.Undo,
      STATES.Film,
    ].includes(this.gameState);

    this.animator.display();
    this.menuViewer.displayGameMenu(
      this.scores,
      Utils.parseTime(this.gameTime),
      disableButtons
    );
  }

  /**
   * @method switchTurns
   * Switches the current player
   */
  switchTurns() {
    this.pickedMove = null;
    this.mandatoryPlay = null;
    this.currentPieceID = null;
    this.intermediatePieceID = null;

    this.changePlayer();
    this.gameBoard.setValidMoves(this.playerTurn);
    this.changeState(STATES.PickPiece);
  }

  /**
   * @method setupPieceAnimations
   * Sets up the piece animations for the current move and adds the current board to the game sequences list
   */
  setupPieceAnimations() {
    const playerPiece = this.gameBoard.getPlayerPiece(this.pickedPiece);
    const upgrade = this.gameBoard.isUpgradeMove(
      this.playerTurn,
      this.pickedPiece,
      this.pickedMove
    );

    const animation = new MyPieceAnimation(
      this.scene,
      playerPiece,
      this.pickedPiece,
      this.pickedMove,
      this.gameBoard.capturing
    );
    let totalTime = animation.endTime;

    this.gameSequences.addSequence(
      this.gameBoard.getBoardCopy(),
      this.gameBoard.getAuxiliarBoardCopy(),
      this.playerTurn,
      [...this.scores],
      this.mandatoryPlay
    );
    this.mandatoryPlay = null;

    if (upgrade) {
      const upgradeAnimation = this.addAnimation(
        [this.pickedMove, totalTime],
        "evolution"
      );
      totalTime = upgradeAnimation.endTime;

      animation.addFinalAnimation(totalTime);
    }
    this.animator.addPieceAnimation(animation);
    this.addAnimationToSequence(animation);

    if (this.gameBoard.capturing) {
      this.setupCaptureAnimations(totalTime);
      this.light.setAnimationFromKeyframes(animation);
    } else this.light.startAnimation(this.pickedPiece, this.pickedMove);

    this.currentPieceID = this.gameBoard.emptyPosition(this.pickedPiece);
    this.changeState(STATES.MovePiece);
  }

  /**
   * @method setupCaptureAnimations
   * Sets up the animations for the capture of a piece and adds the current board to the game sequences list
   * @param {Object} endTime - Animations end time
   * @returns {Integer} - The end time of the capture animation
   */
  setupCaptureAnimations(endTime) {
    const intermediatePos = this.gameBoard.intermediatePosition(
      this.pickedPiece,
      this.pickedMove
    );

    const piece = this.gameBoard.getPlayerPiece(intermediatePos);
    const auxiliarBoardPos = this.gameBoard.getAuxiliarBoardPosition(
      1 - this.playerTurn
    );

    const animation = this.addAnimation([
      piece,
      intermediatePos,
      auxiliarBoardPos,
      false,
      endTime,
    ]);

    this.addAnimation(
      [this.camera.getPosition(), intermediatePos, auxiliarBoardPos, endTime],
      "capture"
    );

    this.intermediatePieceID = this.gameBoard.emptyPosition(intermediatePos);
    return animation.endTime;
  }

  /**
   * @method addAnimation
   * Adds an animation to the game sequence
   * @param {Array} animationParams - Animation parameters
   * @param {String} animationType - Animation type
   * @returns {Animation Object} - Created animation
   */
  addAnimation(animationParams, animationType = "piece") {
    let animation;

    if (animationType == "piece")
      animation = this.animator.createPieceAnimation(...animationParams);
    else if (animationType == "evolution")
      animation = this.animator.createEvolutionAnimation(...animationParams);
    else animation = this.animator.createCaptureAnimation(...animationParams);

    this.addAnimationToSequence(animation);

    return animation;
  }

  /**
   * @method addAnimationToSequence
   * Adds an animation to the game sequence
   * @param {Animation Object} animation
   */
  addAnimationToSequence(animation) {
    this.gameSequences.addAnimation(animation);
  }

  /**
   * @method undoMove
   * Undoes the last move made
   */
  undoMove() {
    const sequence = this.gameSequences.undo();
    if (!sequence) return;

    const { moves } = sequence;

    for (let i = moves.length - 1; i >= 0; i--) {
      const animation = moves[i];
      animation.revert();

      if (animation instanceof MyPieceAnimation) {
        this.animator.addPieceAnimation(animation);
        this.gameBoard.emptyPosition(animation.endPos);
      } else if (animation instanceof MyEvolutionAnimation)
        this.animator.setEvolutionAnimation(animation);
      else this.animator.setCaptureAnimation(animation);
    }

    this.previousSequence = sequence;
    this.changeState(STATES.Undo);
  }

  /**
   * @method beginFilm
   * Begins the film of the game
   */
  beginFilm() {
    if (!this.gameSequences.hasSequences()) return;

    this.filmSequence = 0;
    this.finalBoards = {
      board: this.gameBoard.getBoardCopy(),
      auxiliarBoard: this.gameBoard.getAuxiliarBoardCopy(),
    };
    this.changeState(STATES.Film);
  }

  /**
   * @method changeState
   * Changes the game state
   * @param {Integer} state - New game state
   */
  changeState(state) {
    this.gameState = state;
  }

  /**
   * @method changePlayer
   * Changes the player turn and resets the turn time
   * @param {Integer} player - New player turn
   */
  changePlayer(player = null) {
    this.gameTime = TurnTime;
    this.playerTurn = player == null ? this.playerTurn ^ 1 : player;
  }

  /**
   * @method resetGame
   * Resets the game to the initial state
   */
  resetGame() {
    this.animator.resetAnimations();
    this.camera.resetPosition();
    this.gameSequences.reset();
    this.gameSettings.audio.pause();
    this.gameSettings = "Space";
    this.scene.reset();
    this.changeState(STATES.Menu);
  }

  /**
   * @method clickHandler
   * Handles the click of the player
   * @param {Object} click - Click button
   * @returns {Boolean} - True if the click was handled, false otherwise
   */
  clickHandler(click) {
    if (click == null) return true;
    const { button } = click;

    switch (button) {
      case "Camera":
        this.camera.changeCamera();
        return true;
      case "Home":
        this.resetGame();
        return true;
      case "Undo":
        this.undoMove();
        return true;
      case "Film":
        this.beginFilm();
        return true;
      default:
        return false;
    }
  }

  /**
   * @method clicked
   * Checks if the player has done a click
   * @returns {Object} - Click properties
   */
  clicked() {
    if (this.scene.pickMode) return null;

    let click = null;
    if (this.scene.pickResults.length > 0) {
      for (let i = 0; i < this.scene.pickResults.length; i++) {
        const clickInfo = this.scene.pickResults[i][0];
        if (!clickInfo) continue;

        click = clickInfo;
        break;
      }
      this.scene.pickResults.splice(0, this.scene.pickResults.length);
    }
    return click;
  }
}
