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

//Define admin user

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
  if (!req.session || !req.session.admin === 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  //Admin only
  res.sendFile(path.join(__dirname, "src", "dashboard.html"));
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
  if (!req.session || !req.session.username || !req.session.admin === 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }

  const selectQuery =
    "SELECT id, username, email, creation_date, last_update_time, admin FROM users";

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
  if (!req.session || !req.session.username || !req.session.admin === 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  const userId = req.params.userId;
  const query = `
    SELECT items.id, items.name, items.category, userItems.quantity 
    FROM userItems
    JOIN items ON userItems.item_id = items.id
    WHERE userItems.user_id = ?
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database query failed" });
      return;
    }
    res.json(results);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.session || !req.session.username) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }

  const selectQuery =
    "SELECT id, username, email, creation_date, last_update_time, admin FROM users WHERE id = ?";

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
  const selectQuery = "SELECT * FROM userItems WHERE user_id = ?";
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
    ORDER BY ui.item_id;
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

// Random time between 5 to 30 seconds
//return Math.floor(Math.random() * (30000 - 5000 + 1)) + 5000;

// Random time between 5 to 15 seconds
//return Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;

app.post("/api/update-settings", (req, res) => {
  if (!req.session || !req.session.admin === 1) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }

  const minTime = req.body.minTime;
  const maxTime = req.body.maxTime;

  if (!minTime || !maxTime) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }

  if (minTime >= maxTime) {
    res.status(400).json({ message: "Min time must be lower than max time" });
    return;
  }

  const updateQuery = "UPDATE timeSettings SET min_time = ?, max_time = ?";
  connection.query(updateQuery, [minTime, maxTime], (error) => {
    if (error) {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    res.json({ message: "Settings updated successfully" });
  });
});

app.get("/api/settings", (req, res) => {
  if (!req.session || !req.session.admin === 1) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const selectQuery = "SELECT min_time, max_time FROM timeSettings";
  connection.query(selectQuery, (error, results, fields) => {
    if (error) {
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    if (results.length === 0) {
      const insertQuery =
        "INSERT INTO timeSettings (min_time, max_time) VALUES (?, ?)";
      connection.query(insertQuery, [3, 5], (error) => {
        if (error) {
          res.status(500).json({ message: "Internal server error" });
          return;
        }
        res.json({ min_time: 3, max_time: 5 });
      });
    } else {
      res.json(results[0]);
    }
  });
});

function getRandomTime() {
  return new Promise((resolve, reject) => {
    // Retrieve times from database table settings
    const selectQuery = "SELECT min_time, max_time FROM timeSettings";
    connection.query(selectQuery, (error, results, fields) => {
      if (error) {
        console.error("Failed to retrieve times from database");
        reject(error);
        return;
      }

      const minTime = results[0].min_time;
      const maxTime = results[0].max_time;

      // Generate random time between minTime and maxTime
      const randomTime =
        Math.floor(Math.random() * (maxTime * 1000 - minTime * 1000 + 1)) +
        minTime * 1000;
      resolve(randomTime);
    });
  });
}

const apiLimiter = (req, res, next) => {
  if (!req.session.randomTime || !req.session.startTime) {
    return res.status(400).json({
      message: "You must start fishing first.",
    });
  }

  const windowMs = req.session.randomTime;
  const startTime = req.session.startTime;
  const currentTime = Date.now();

  if (currentTime - startTime < windowMs) {
    return res.status(429).json({
      message:
        "You have cast your line too quickly! Please wait a moment before fishing again.",
    });
  }

  next();
};

// Apply rate limiter to /api/catch endpoint
app.use("/api/catch", apiLimiter);

app.get("/api/catch", (req, res) => {
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

      // Reset the session values to enforce the need to call /api/start-fishing again
      delete req.session.randomTime;
      delete req.session.startTime;

      res.json(selectedItem);
    });
  });
});

app.get("/api/start-fishing", async (req, res) => {
  if (!req.session || !req.session.username) {
    res.sendFile(path.join(__dirname, "src", "401page.html"));
    return;
  }
  if (req.session.randomTime) {
    return res.status(400).json({
      message:
        "You are already fishing. Please wait until you catch something.",
    });
  }
  const randomTime = await getRandomTime();
  console.log("Random time:", randomTime);
  req.session.randomTime = randomTime;
  req.session.startTime = Date.now();
  res.json({ randomTime });
});

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
      req.session.admin = user.admin === 1;
      res.status(200).send("User logged in successfully");
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
