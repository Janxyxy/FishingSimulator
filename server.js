const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
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

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "docs.html"));
});
app.get("/profile", (req, res) => {
  if (!req.session || !req.session.userId) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    //res.status(401).send("Přístup zamítnut. Prosím přihlašte se.");
    return;
  }
  res.sendFile(path.join(__dirname, "src", "profile.html"));
});

app.get("/dashboard", (req, res) => {
  if (req.session && req.session.userId === 1) {
    res.sendFile(path.join(__dirname, "src", "dashboard.html"));
    return;
  }
  res.sendFile(path.join(__dirname, "src", "401page.html"));
});

app.get("/mainpage", (req, res) => {
  //use/get?
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

app.delete("/api/delete", (req, res) => {
  DeleteUser(req, res);
});

//API endpoints

//Admin only
app.get("/api/users", (req, res) => {
  if (!req.session || !req.session.username || req.session.userId !== 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }

  const selectQuery =
    "SELECT id, username, email, creation_date, last_update_time FROM users";

  connection.query(selectQuery, (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Error retrieving user data from database: " + error.message);
      return;
    }
    res.json(results);
  });
});

//Admin only
app.get("/api/inventory/:userId", (req, res) => {
  if (!req.session || !req.session.username || req.session.userId !== 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  const userId = req.params.userId;
});

app.get("/api/user", (req, res) => {
  if (!req.session || !req.session.username) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }

  const selectQuery =
    "SELECT id, username, email, creation_date, last_update_time FROM users WHERE id = ?";

  connection.query(
    selectQuery,
    [req.session.userId],
    (error, results, fields) => {
      if (error) {
        res
          .status(500)
          .send("Error retrieving user data from database: " + error.message);
        return;
      }
      res.json(results);
    }
  );
});

app.get("/api/user-check", (req, res) => {
  if (!req.session || !req.session.username) {
    res.json({ logged: "false" });
    return;
  }
  res.json({ logged: "true" });
});

app.get("/api/inventory", (req, res) => {
  if (!req.session || !req.session.username) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  const selectQuery = "SELECT * FROM useritems WHERE user_id = ?";
  connection.query(
    selectQuery,
    [req.session.userId],
    (error, results, fields) => {
      if (error) {
        res
          .status(500)
          .send(
            "Error retrieving inventory data from database: " + error.message
          );
        return;
      }
      res.json(results);
    }
  );
});

app.get("/api/user-items", (req, res) => {
  const query = `
    SELECT u.username, SUM(ui.quantity) as totalItems
    FROM users u
    JOIN userItems ui ON u.id = ui.user_id
    GROUP BY u.id
    ORDER BY totalItems DESC;
  `;
  connection.query(query, (error, results) => {
    if (error) throw error;
    if (results.length === 0) {
    }
    res.json(results);
  });
});

app.get("/api/items", (req, res) => {
  const selectQuery = "SELECT * FROM items";
  connection.query(selectQuery, (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Error retrieving item data from database: " + error.message);
      return;
    }
    res.json(results);
  });
});

// Rate limiter for the fish API
const apiLimiter = rateLimit({
  windowMs: 5000, // 5s
  max: 1, // Limit each user to 10 requests per windowMs
  keyGenerator: (req) => req.session.userId, // Use userId from session as the key
  handler: (req, res /*next*/) => {
    res.status(429).json({
      message: "Too many requests, please try again later.",
    });
  },
});

// Apply rate limiter to /api/fish endpoint
app.use("/api/fish", apiLimiter);

//Fish API

app.get("/api/fish", (req, res) => {
  if (!req.session || !req.session.username) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  const selectQuery = "SELECT * FROM items";
  connection.query(selectQuery, (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Error retrieving fish data from database: " + error.message);
      return;
    }

    const selectedItem = selectItemByDropRate(results);

    if (!selectedItem) {
      res
        .status(500)
        .send("Error selecting item based on drop rate: No item selected");
      return;
    }

    //console.log(selectedItem);

    // Get user id from session (assuming you store it in session)
    const userId = req.session.userId;

    // Insert or update the selected item in the userItems table
    insertOrUpdateUserItem(userId, selectedItem.id, 1, (err) => {
      if (err) {
        res
          .status(500)
          .send(
            "Error inserting or updating item in userItems table: " +
              err.message
          );
        return;
      }
      res.json(selectedItem);
    });
  });
});

//Fishing functions

function insertOrUpdateUserItem(userId, itemId, quantity, callback) {
  const checkQuery =
    "SELECT * FROM userItems WHERE user_id = ? AND item_id = ?";
  connection.query(checkQuery, [userId, itemId], (err, results) => {
    if (err) {
      return callback(err);
    }
    if (results.length > 0) {
      // Item exists, update the quantity
      const updateQuery =
        "UPDATE userItems SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?";
      connection.query(updateQuery, [quantity, userId, itemId], callback);
    } else {
      // Item does not exist, insert a new row
      const insertQuery =
        "INSERT INTO userItems (user_id, item_id, quantity) VALUES (?, ?, ?)";
      connection.query(insertQuery, [userId, itemId, quantity], callback);
    }
  });
}

function selectItemByDropRate(items) {
  const totalDropRate = items.reduce((acc, item) => {
    const chance = parseFloat(item.unenchanted_chance);
    if (isNaN(chance)) {
      console.error("Invalid drop rate for item:", item);
      return acc;
    }
    return acc + chance;
  }, 0);

  if (totalDropRate === 0) {
    console.error("Total drop rate is zero, no items to select.");
    return null;
  }

  let random = Math.random() * totalDropRate;

  for (const item of items) {
    const chance = parseFloat(item.unenchanted_chance);
    if (isNaN(chance)) {
      continue; // Skip items with invalid drop rates
    }
    if (random < chance) {
      return item;
    }
    random -= chance;
  }

  console.error("Failed to select item after iterating all items.");
  return null; // In case something goes wrong
}

//Auth Functions

function TryLogin(email, password, req, res) {
  const selectQuery = "SELECT * FROM users WHERE email = ? || username = ?";
  connection.query(selectQuery, [email, email], (error, results, fields) => {
    if (error) {
      res.status(500).send("Chyba databáze při přihlášení: " + error.message);
      return;
    }
    if (results.length === 0) {
      res.status(402).send("User not found");
      return;
    }
    const user = results[0];
    bcrypt.compare(password, user.password_hash, (err, isMatch) => {
      if (err) {
        "Error password: " + err.message;
        return;
      }
      if (!isMatch) {
        res.status(401).send("Wrong password");
        return;
      }
      // Set user session details
      req.session.userId = user.id;
      req.session.username = user.username;
      res.status(201).send("User logged in successfully");
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

function DeleteUser(req, res) {
  console.log("Delete request received");
  const userId = req.session.userId;

  if (!userId) {
    console.log("session ID invalid");
    res.status(400).send("Invalid session ID");
    return;
  }

  // Delete all items from userItems table with user_id = userId
  const deleteQueryItems = "DELETE FROM userItems WHERE user_id = ?";
  connection.query(deleteQueryItems, [userId], (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Database error while deleting user items: " + error.message);
      console.log("Database error while deleting user items: " + error.message);
      return;
    }

    console.log("User items deleted successfully");
  });

  const deleteQuery = "DELETE FROM users WHERE id = ?";

  connection.query(deleteQuery, [userId], (error, results, fields) => {
    if (error) {
      res
        .status(500)
        .send("Database error while deleting user: " + error.message);
      console.log("Database error while deleting user: " + error.message);
      return;
    }

    if (results.affectedRows === 0) {
      res.status(404).send("User not found");
      console.log("User not found id: " + userId);
      return;
    }

    resetAutoIncrement();

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Chyba při odstraňování session");
      }
      res.sendStatus(200);
    });

    console.log("User deleted successfully");
  });
}

function resetAutoIncrement() {
  const resetQuery = "ALTER TABLE users AUTO_INCREMENT = 1";
  connection.query(resetQuery, (error, results, fields) => {
    if (error) {
      console.error("Error resetting auto increment: " + error.message);
      return;
    }
    console.log("Auto increment reset successfully");
  });
}

resetAutoIncrement();

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
