// Phaser Retro Wave Racing Game
import Phaser from "phaser";
// Import background image from assets/back01.png
import background from "./assets/back02.png";
// Import car image from assets/car.png
import car from "./assets/car.png";

import enemyCar from "./assets/car3.png";
import tree from "./assets/tree01.png";

const WIDTH = 480;
const HEIGHT = 640;

const LINES_TOP = 400;

const VERTICAL_LINE_COUNT = 32;
const VERTICAL_LINES_SPREAD_WIDTH = WIDTH * 6;
const DISTANCE_BETWEEN_VERTICAL_LINES =
  VERTICAL_LINES_SPREAD_WIDTH / VERTICAL_LINE_COUNT;

const HORIZONTAL_LINE_COUNT = 64;

// Distance between viewer's eyes and screen
const VIEWER_SCREEN_DISTANCE = WIDTH / 2;

const HORIZONTAL_LINES_DISTANCE = 64;

const CAR_WIDTH = 240;
const CAR_Z_POS = 100;

const BACKGROUND_TOP = 190;

const ENEMY_CAR_APPEARANCE_Y = 1500;

let carSpeed = 5;

const X_SHIFT_SPEED = 5;
const MAX_X_SHIFT = 300;
let xShift = 0;

const ENEMY_CAR_Y_DISTANCE = 300;

const CAR_Z_LENGTH = 50;

const TREE_WIDTH = 32;

const COLORS = {
  background: 0x361b52,
  line: 0xffffff,
};

class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game", active: true });
  }

  preload() {
    console.log("preload");
    // Load background image from background
    this.load.image("back", background);

    // Load car image from car
    this.load.image("car", car);

    // Load enemy car image from enemyCar
    this.load.image("enemyCar", enemyCar);

    // Load tree image
    this.load.image("tree", tree);
  }

  groundPosYToScreen(y) {
    // 0 is the bottom of the screen
    // LINES_TOP is horizon, infinity.
    // Return projection of y onto the screen
    //return HEIGHT - ((VIEWER_SCREEN_DISTANCE + y) * y) / (HEIGHT - LINES_TOP);
    const H = HEIGHT - LINES_TOP;
    return HEIGHT - (H * y) / (VIEWER_SCREEN_DISTANCE + y);
  }

  // ground x = 0 is center
  groundPosXToScreen(x, y) {
    return WIDTH / 2 + this.scaleToScreen(x, y);
  }

  scaleToScreen(x, y) {
    return (VIEWER_SCREEN_DISTANCE * x) / (VIEWER_SCREEN_DISTANCE + y);
  }

  create() {
    // array of 12 vertical lines
    this.verticalLines = [];
    this.horizontalLines = [];

    this.verticalOffset = 0;
    this.horizontalOffset = 0;

    // Enemy car array, each car contains {car, x, y}
    this.enemyCars = [];

    this.myCar = null;

    // Score and high score
    this.score = 0;
    this.highScore = 0;

    // Load high score from localStorage
    const highScore = localStorage.getItem("highScore");
    if (highScore) {
      this.highScore = parseInt(highScore);
    }

    // trees
    this.treesLeft = [];
    this.treesRight = [];

    // Cretare vertical lines
    for (let i = 0; i < VERTICAL_LINE_COUNT; i++) {
      const x =
        WIDTH / 2 -
        VERTICAL_LINES_SPREAD_WIDTH / 2 +
        (i * VERTICAL_LINES_SPREAD_WIDTH) / (VERTICAL_LINE_COUNT - 1);
      const line = this.add.line(
        0,
        0,
        WIDTH / 2,
        LINES_TOP,
        x,
        HEIGHT,
        COLORS.line
      );
      line.setOrigin(0);
      this.verticalLines.push(line);
    }
    // Create horizontal lines
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      const groundY = HORIZONTAL_LINES_DISTANCE * i;
      const y = this.groundPosYToScreen(groundY);
      const line = this.add.line(0, 0, 0, y, WIDTH, y, COLORS.line);
      line.setOrigin(0);
      this.horizontalLines.push(line);
    }

    // Create background and stretch it to the screen width.
    // Show the background image at the top BACKGROUND_TOP position.
    const back = this.add.image(0, BACKGROUND_TOP, "back");
    back.setOrigin(0);
    back.setScale(WIDTH / back.width);

    const carY = this.groundPosYToScreen(CAR_Z_POS);
    const car = this.add.image(0, 0, "car");
    car.setOrigin(0.5);
    const carWidth = this.scaleToScreen(CAR_WIDTH, CAR_Z_POS);
    // Scale the car to CAR_WIDTH pixels wide.
    car.setScale(carWidth / car.width);
    car.y = carY;
    // Set the car to the middle of the screen.
    car.x = WIDTH / 2;
    car.setDepth(1 / CAR_Z_POS);
    this.myCar = car;

    this.createEnemyCar();

    // Create trees
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      this.treesLeft.push(this.add.image(0, 0, "tree"));
      this.treesRight.push(this.add.image(0, 0, "tree"));
    }

    // Create score text
    this.scoreText = this.add.text(10, 10, "Score: 0", {
      fontSize: "32px",
      fill: "#fff",
    });
    this.scoreText.setDepth(1);
    // Create high score text
    this.highScoreText = this.add.text(10, 50, "High Score: 0", {
      fontSize: "32px",
      fill: "#fff",
    });
    this.highScoreText.setDepth(1);
  }

  update() {
    // Increment vertical offset
    this.verticalOffset += carSpeed;
    // If vertical offset is greater than (HEIGHT - LINES_TOP)/HORIZONTAL_LINE_COUNT, reset it to 0
    if (this.verticalOffset > HORIZONTAL_LINES_DISTANCE) {
      this.verticalOffset = 0;
    }
    this.updateHorizontalLines();

    const maxCarXShift = MAX_X_SHIFT - CAR_WIDTH / 2;

    // If right part of the screen touched, decrement horizontal offset
    if (
      this.input.activePointer.isDown &&
      this.input.activePointer.x > WIDTH / 2
    ) {
      if (xShift > -maxCarXShift) {
        xShift -= X_SHIFT_SPEED;
        this.horizontalOffset -= X_SHIFT_SPEED;
        // If horizontal offset is less than 0, reset it to DISTANCE_BETWEEN_VERTICAL_LINES
        if (this.horizontalOffset < 0) {
          this.horizontalOffset = DISTANCE_BETWEEN_VERTICAL_LINES;
        }
        // shift all enemy cars
        this.enemyCars.forEach((enemyCar) => {
          enemyCar.x -= X_SHIFT_SPEED;
        });
      }
    }
    // If left part of the screen touched, increment horizontal offset
    if (
      this.input.activePointer.isDown &&
      this.input.activePointer.x < WIDTH / 2
    ) {
      if (xShift < maxCarXShift) {
        xShift += X_SHIFT_SPEED;
        this.horizontalOffset += X_SHIFT_SPEED;
        // If horizontal offset is greater than DISTANCE_BETWEEN_VERTICAL_LINES, reset it to 0
        if (this.horizontalOffset > DISTANCE_BETWEEN_VERTICAL_LINES) {
          this.horizontalOffset = 0;
        }
        // shift all enemy cars
        this.enemyCars.forEach((enemyCar) => {
          enemyCar.x += X_SHIFT_SPEED;
        });
      }
    }

    this.updateVerticalLines();

    // Decrement enemy car's y position by carSpeed
    this.enemyCars.forEach((enemyCar) => {
      enemyCar.y -= carSpeed;
      // If enemy car y position < 0, remove it from the array
      if (enemyCar.y < 0) {
        // Delete enemyCar.car from the scene
        this.scene.remove(enemyCar.car);
        enemyCar.car.destroy();
        enemyCar.toDelete = true;
        // Increment score
        this.score++;
        // If score is greater than high score, update high score
        if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem("highScore", this.highScore);
        }
        // Update score text
        this.scoreText.setText("Score: " + this.score);
        this.highScoreText.setText("High Score: " + this.highScore);
      } else {
        enemyCar.car.y = this.groundPosYToScreen(enemyCar.y);
        enemyCar.car.x = this.groundPosXToScreen(enemyCar.x, enemyCar.y);
        const carWidth = this.scaleToScreen(CAR_WIDTH, enemyCar.y);
        // Scale the enemyCar.car to carWidth pixels wide.
        enemyCar.car.setScale(carWidth / enemyCar.car.width);
        enemyCar.car.setDepth(1 / enemyCar.y);
      }
    });
    // delete cars with toDelete property set to true
    this.enemyCars = this.enemyCars.filter((car) => !car.toDelete);

    let createNewCar = !this.enemyCars.length;
    if (this.enemyCars.length) {
      const lastEnemyCar = this.enemyCars[this.enemyCars.length - 1];
      const lastCarMoved = ENEMY_CAR_APPEARANCE_Y - lastEnemyCar.y;
      if (
        lastCarMoved > ENEMY_CAR_Y_DISTANCE &&
        lastCarMoved - carSpeed <= ENEMY_CAR_Y_DISTANCE
      ) {
        createNewCar = true;
      }
    }
    if (createNewCar) {
      this.createEnemyCar();
    }

    this.updateTrees();

    this.detectCollision();
  }

  updateTrees() {
    const updateTree = (tree, groundY, sign) => {
      tree.x = this.groundPosXToScreen(sign*MAX_X_SHIFT + xShift, groundY);
      tree.y = this.groundPosYToScreen(groundY);
      // Scale the tree to TREE_WIDTH pixels wide.
      const treeWidth = this.scaleToScreen(TREE_WIDTH, groundY);
      tree.setScale(treeWidth / tree.width);
      tree.setDepth(1 / groundY);
    };
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      const groundY = HORIZONTAL_LINES_DISTANCE * i - this.verticalOffset;
      updateTree(this.treesLeft[i], groundY, -1);
      updateTree(this.treesRight[i], groundY, 1);
    }
  }

  updateHorizontalLines() {
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      const line = this.horizontalLines[i];
      const groundY = HORIZONTAL_LINES_DISTANCE * i - this.verticalOffset;
      const y = this.groundPosYToScreen(groundY);
      line.geom.y1 = y;
      line.geom.y2 = y;
    }
  }

  updateVerticalLines() {
    for (let i = 0; i < VERTICAL_LINE_COUNT; i++) {
      const line = this.verticalLines[i];
      const x =
        WIDTH / 2 -
        VERTICAL_LINES_SPREAD_WIDTH / 2 +
        (i * VERTICAL_LINES_SPREAD_WIDTH) / (VERTICAL_LINE_COUNT - 1) +
        this.horizontalOffset;
      line.geom.x2 = x;
    }
  }

  createEnemyCar() {
    const enemyCar = this.add.image(0, 0, "enemyCar");
    enemyCar.setOrigin(0.5);
    enemyCar.setScale(CAR_WIDTH / enemyCar.width);
    const y = ENEMY_CAR_APPEARANCE_Y;
    enemyCar.y = this.groundPosYToScreen(y);
    // x is random between 0 and WIDTH
    const x = Math.random() * WIDTH - WIDTH / 2 + xShift;
    enemyCar.x = this.groundPosXToScreen(x, y);
    const carWidth = this.scaleToScreen(CAR_WIDTH, y);
    enemyCar.setScale(carWidth / enemyCar.width);
    this.enemyCars.push({ car: enemyCar, x, y });
  }

  detectCollision() {
    // Check if any enemy car collides with myCar
    this.enemyCars.forEach((enemyCar) => {
      if (
        enemyCar.y < CAR_Z_POS + CAR_Z_LENGTH &&
        enemyCar.y > CAR_Z_POS &&
        Math.abs(enemyCar.x) < CAR_WIDTH / 2
      ) {
        // Game over
        this.scene.start("GameOver", {
          score: this.score,
          highScore: this.highScore,
        });
      }
    });
  }
}

class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver", active: false });
  }

  init(data) {
    this.score = data.score;
    this.highScore = data.highScore;
  }

  create() {
    // Display game over text at the center of the screen
    const gameOverText = this.add.text(WIDTH / 2, HEIGHT / 2, "Game Over", {
      fontSize: "64px",
      fill: "#fff",
      stroke: "#000",
      strokeThickness: 6,
    });
    gameOverText.setOrigin(0.5);

    // Display score text at the center of the screen
    const scoreText = this.add.text(
      WIDTH / 2,
      HEIGHT / 2 + 100,
      "Score: " + this.score,
      {
        fontSize: "32px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 6,
      }
    );
    scoreText.setOrigin(0.5);

    // Display high score text at the center of the screen
    const highScoreText = this.add.text(
      WIDTH / 2,
      HEIGHT / 2 + 150,
      "High Score: " + this.highScore,
      {
        fontSize: "32px",
        fill: "#fff",
        stroke: "#000",
        strokeThickness: 6,
      }
    );
    highScoreText.setOrigin(0.5);

    // wait 0.5 seconds
    const self = this;
    self.timePassed = false;
    setInterval(() => {
      self.timePassed = true;
    }, 1000);
  }

  update() {
    if (this.timePassed) {
      // on mouse down event restart the game
      if (this.input.activePointer.isDown) {
        this.scene.start("Game");
      }
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "retro-wave-racing",
  width: WIDTH,
  height: HEIGHT,
  scene: [Game, GameOver],
  backgroundColor: COLORS.background,
  pixelArt: true,

  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);
