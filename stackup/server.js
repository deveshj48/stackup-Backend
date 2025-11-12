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
  rightGrid = [[null, null, null], 
              [null, null, null], 
              [null, null, null]];
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

  const newX = robot.side === 'left' ? robot.x : robot.x - 3; // Adjust x for right grid

  if (currGrid[robot.y][newX])
    return res.status(400).json({ error: "Position already occupied" });

  currGrid[robot.y][newX] = robot.holding

  if (currGrid === leftGrid) {
    leftGrid = currGrid;
  } else {
    rightGrid = currGrid;
  }

   console.log(rightGrid);

  robot.holding = null;
  res.json({ leftGrid, rightGrid, robot });
});

app.get("/check", (req, res) => {

  // if all the original grid still has circles, then incorrect
  const allNull = leftGrid.every(row => row.every(value => value === null));

  if (!allNull) {
    res.json({ message: "Incorrect Configuration" });
    return ;
  }

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
       
        // red can only be on top row
        if (rightGrid[0][j] !== "red" ) {
            res.json({ message: "Incorrect Configuration red" });
            return ;
        }  
        
        if (i !== 0){
          if (rightGrid[i][j] === "blue" && rightGrid[i-1][j] !== "red") {
              res.json({ message: "Incorrect Configuration blue" });
              return ;
            }
        }
    }
    
  }

  res.json({ message: "Correct Configuration" });

});


app.listen(3001, () => console.log("Server running on port 3001"));
