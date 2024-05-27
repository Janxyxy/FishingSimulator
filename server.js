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

// Middleware to ensure that only logged-in users can access the main page
app.use(express.static("public", { redirect: false }));

// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());

// Serve static files from the public directory
app.use("/public", express.static(path.join(__dirname, "public")));

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
    cookie: { secure: false }, // Change to true if HTTPS is used
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

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "index.html"));
});
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "login.html"));
});

app.get("/profile", (req, res) => {
  if (!req.session || !req.session.userId) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    //res.status(401).send("Přístup zamítnut. Prosím přihlašte se.");
    return;
  }
  res.sendFile(path.join(__dirname, "src", "profile.html"));
});

app.use("/mainpage", (req, res, next) => {
  if (!req.session || !req.session.userId) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    //res.status(401).send("Přístup zamítnut. Prosím přihlašte se.");
    return;
  }
  res.sendFile(path.join(__dirname, "src", "mainpage.html"));
});

//API authentication

app.post("/api/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  TryLogin(email, password, req, res);
});

app.get("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Chyba při odstraňování session");
    }
    res.redirect("/home");
  });
});

app.post("/api/register", (req, res) => {
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

//ASP endpoints

app.get("/api/userId", (req, res) => {
  if (!req.session || !req.session.userId) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ userId: req.session.userId });
});

app.get("/api/username", (req, res) => {
  if (!req.session || !req.session.username) {
    res.status(401).send("Unauthorized");
    return;
  }
  res.json({ username: req.session.username });
});

app.get("/api/fish", (req, res) => {
  const selectQuery = "SELECT * FROM fish";
  connection.query(selectQuery, (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Error retrieving fish data from database: " + error.message);
      return;
    }
    res.json(results);
  });
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
        "Chyba při ověřování hesla: " + err.message;
        return;
      }
      if (!isMatch) {
        res.status(401).send("Nesprávné heslo");
        return;
      }
      // Set user session details
      req.session.userId = user.id;
      req.session.username = user.username;
      res.status(201).send("Přihlášení úspěšné");
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
        const existingUser = results[0];
        if (
          existingUser.username === username &&
          existingUser.email === email
        ) {
          res.status(409).json({ error: "Username and email already exist" });
        } else if (existingUser.username === username) {
          res.status(409).json({ error: "Username already exists" });
        } else {
          res.status(409).json({ error: "Email already exists" });
        }
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
