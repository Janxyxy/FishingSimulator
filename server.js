const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const cors = require("cors");
const session = require("express-session");
const path = require("path");

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

app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Nastaveno na false, protože je používán pouze localhost
  })
);

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

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  TryLogin(email, password, req, res);
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Chyba při odstraňování session");
    }
    res.redirect("/login.html");
  });
});
// Middleware to ensure that only logged-in users can access the main page
app.use(express.static("public", { redirect: false }));

app.get("/", (req, res) => {
  res.redirect("/register.html");
});

app.use("/mainpage", (req, res, next) => {
  if (!req.session || !req.session.userId) {
    res.status(401).send("Přístup zamítnut. Prosím přihlašte se.");
    return;
  }
  res.sendFile(path.join(__dirname, "src", "mainpage.html"));
});
///Functions///

function TryLogin(email, password, req, res) {
  const selectQuery = "SELECT * FROM users WHERE email = ?";
  connection.query(selectQuery, [email], (error, results, fields) => {
    if (error) {
      res.status(500).send("Chyba databáze při přihlášení: " + error.message);
      return;
    }
    if (results.length === 0) {
      res.status(402).send("Uživatel nenalezen");
      return;
    }
    const user = results[0];
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        res.status(500).send("Chyba při ověřování hesla: " + err.message);
        return;
      }
      if (!isMatch) {
        res.status(401).send("Nesprávné heslo");
        return;
      }
      // Set user session details
      req.session.userId = user.id;
      res.send("Přihlášení úspěšné");
    });
  });
}

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
