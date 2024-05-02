const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");

env = require("dotenv").config();

const app = express();
app.use(cors());
const port = 3000;

// Middleware
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// MySQL Connection
const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + connection.threadId);
});

// Routes

app.post("/register", (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const password2 = req.body.password2;

  if (!username || !email || !password || !password2) {
    res.status(400).send("Empty fields detected");
    return;
  }

  if (password !== password2) {
    res.status(400).send("Passwords do not match");

    return;
  }
  // Check if user already exists
  checkForUser(username, email);
  // Encrypt the password

  // Create a new user in the database

  // Return 201 Created status
});

//Functions
function checkForUser(username, email) {
  connection.query(
    `SELECT * FROM users WHERE username = '${username}'`,
    (err, result) => {
      if (err) {
        console.log(err);
        return;
      }
      if (result.length > 0) {
        console.log("User already exists");
      } else {
        console.log("User not found");
      }
    }
  );
}

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
