// Phaser Retro Wave Racing Game
import Phaser from "phaser";
// Import background image from assets/back01.png
import background from "./assets/back02.png";
// Import car image from assets/car.png
import car from "./assets/car.png";

const WIDTH = 480;
const HEIGHT = 640;

const LINES_TOP = 400;

const VERTICAL_LINE_COUNT = 32;
const VERTICAL_LINES_SPREAD_WIDTH = WIDTH * 6;
const DISTANCE_BETWEEN_VERTICAL_LINES = VERTICAL_LINES_SPREAD_WIDTH / VERTICAL_LINE_COUNT;

const HORIZONTAL_LINE_COUNT = 64;

// Distance between viewer's eyes and screen
const VIEWER_SCREEN_DISTANCE = WIDTH / 2;

const HORIZONTAL_LINES_DISTANCE = 64;

const CAR_WIDTH = 160;
const CAR_BOTTOM = 120;

const BACKGROUND_TOP = 160;

const COLORS = {
  background: 0x361b52,
  line: 0xffffff,
};

class MyGame extends Phaser.Scene {
  constructor() {
    super();
    // array of 12 vertical lines
    this.verticalLines = [];
    this.horizontalLines = [];

    this.verticalOffset = 0;
    this.horizontalOffset = 0;
  }

  preload() {
    // Load background image from background
    this.load.image("back", background);

    // Load car image from car
    this.load.image("car", car);
  }

  groundPosYToScreen(y) {
    // 0 is the bottom of the screen
    // LINES_TOP is horizon, infinity.
    // Return projection of y onto the screen
    //return HEIGHT - ((VIEWER_SCREEN_DISTANCE + y) * y) / (HEIGHT - LINES_TOP);
    const H = HEIGHT - LINES_TOP;
    return HEIGHT - (H * y) / (VIEWER_SCREEN_DISTANCE + y);
  }

  create() {
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

    
    // Show the car at the CAR_BOTTOM from the bottom of the screen, 
    // at the middle of the screen.
    const car = this.add.image(0, 0, "car");
    car.setOrigin(0.5);
    // Scale the car to CAR_WIDTH pixels wide.
    car.setScale(CAR_WIDTH / car.width);
    // Set distance between bottom of the car and bottom of the screen to CAR_BOTTOM.
    car.y = HEIGHT - CAR_BOTTOM;
    // Set the car to the middle of the screen.
    car.x = WIDTH / 2;
  }

  update() {
    // Increment vertical offset
    this.verticalOffset += 1;
    // If vertical offset is greater than (HEIGHT - LINES_TOP)/HORIZONTAL_LINE_COUNT, reset it to 0
    if (this.verticalOffset > HORIZONTAL_LINES_DISTANCE) {
      this.verticalOffset = 0;
    }
    this.updateHorizontalLines();

    this.horizontalOffset += 1;
    if (this.horizontalOffset > DISTANCE_BETWEEN_VERTICAL_LINES) {
      this.horizontalOffset = 0;
    }

    this.updateVerticalLines();
  }

  updateHorizontalLines() {
    for (let i = 0; i < HORIZONTAL_LINE_COUNT; i++) {
      const line = this.horizontalLines[i];
      const groundY = HORIZONTAL_LINES_DISTANCE * i - this.verticalOffset;
      const y = this.groundPosYToScreen(groundY);
      //console.log(y, line);
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
        (i * VERTICAL_LINES_SPREAD_WIDTH) / (VERTICAL_LINE_COUNT - 1) + this.horizontalOffset;
      line.geom.x2 = x;
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "retro-wave-racing",
  width: WIDTH,
  height: HEIGHT,
  scene: MyGame,
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
