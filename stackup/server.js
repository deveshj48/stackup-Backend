// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let leftGrid, rightGrid, robot, movementHistory;

function initialize() {
  leftGrid = [
    ["red", "green", "blue"],
    ["blue", "green", "red"],
    ["green", "red", "blue"],
  ];
  rightGrid = [[], [], []];
  robot = { x: 0, y: 0, holding: null, side:'left' }; 
  movementHistory = [];
}
initialize();

function log(action, details = {}) {
  movementHistory.push({ time: new Date().toISOString(), action, ...details });
}

app.get("/state", (req, res) => {
  res.json({ leftGrid, rightGrid, robot, movementHistory });
});

app.post("/reset", (req, res) => {
  initialize();
  res.json({ message: "Reset successful", leftGrid, rightGrid, robot });
});

// Move robot
app.post("/move", (req, res) => {
  const { direction } = req.body;
  const { x, y } = robot;
  let newX = x;
  let newY = y;

  if (direction === "up" && y > 0) newY--;
  else if (direction === "down" && y < 2) newY++;
  else if (direction === "left" && x > 0){ newX--;
  } 
  else if (direction === "right" && x < 5) newX++;
  else return res.status(400).json({ error: "Invalid move" });

  robot.x = newX;
  robot.y = newY;

  if(robot.x < 3) robot.side = 'left'; //if robot is in left grid
  else robot.side = 'right'; 

  log("move", { direction });
  res.json(robot);
  console.log(robot);
});

// Pickup
app.post("/pickup", (req, res) => {
  if (robot.holding)
    return res.status(400).json({ error: "Already holding a circle" });
 
  const currGrid = robot.side === 'left' ? leftGrid : rightGrid;

  const color = currGrid[robot.y][robot.x];
  if (!color)
    return res.status(400).json({ error: "No circle at current position" });

  currGrid[robot.y][robot.x] = null;

  
  if (currGrid === leftGrid) {
    leftGrid = currGrid;
  } else {
    rightGrid = currGrid;
  }

  robot.holding = color;
  log("pickup", { color });
  res.json({ robot });
});

// Drop
app.post("/drop", (req, res) => {
  if (!robot.holding)
    return res.status(400).json({ error: "Not holding any circle" });
  
  const currGrid = robot.side === 'left' ? leftGrid : rightGrid;

  currGrid[robot.y][robot.x] = robot.holding

  //include check for if there is a circle in the current position

  if (currGrid === leftGrid) {
    leftGrid = currGrid;
  } else {
    rightGrid = currGrid;
  }

  robot.holding = null;
  res.json({ leftGrid, rightGrid, robot });
});

app.listen(3000, () => console.log("✅ Server running on port 3000"));
