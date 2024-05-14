const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
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
    res.status(400).send("Empty fields detected"); //400 Bad Request
    return;
  }

  if (password !== password2) {
    res.status(400).send("Passwords do not match"); //400 Bad Request
    return;
  }

  TryMakeUser(username, email, password, res);
});

///Functions///

function TryMakeUser(username, email, password, res) {
  connection.query(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, email],
    (error, results, fields) => {
      if (error) {
        res.status(500).send("Chyba databáze: " + error.message);
        return;
      }
      if (results.length > 0) {
        res.status(409).send("Username or email already exists");
        return;
      } else {
        CreateUser(username, email, password, res);
      }
    }
  );
}

function CreateUser(username, email, password, res) {
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      res.status(500).send("Chyba při šifrování hesla: " + err.message);
      console.log("Chyba při šifrování hesla: " + err.message);
      return;
    }
    const insertQuery =
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
    connection.query(
      insertQuery,
      [username, email, hash],
      (error, results, fields) => {
        if (error) {
          res
            .status(500)
            .send("Chyba databáze při vytváření uživatele: " + error.message);
          console.log(
            "Chyba databáze při vytváření uživatele: " + error.message
          );
          return;
        }
        res.status(201).send("User created successfully");
      }
    );
  });
}

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
