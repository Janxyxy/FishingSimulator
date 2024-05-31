# Fishing Simulator

![Raw Cod](/public/images/Raw_Cod.png)

## Table of Contents

- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Members](#members)
- [Setup](#setup)
- [Database](#database)
  - [Schema](#schema)
  - [Items](#items)
- [ENV Variables](#env-variables)
- [Admin dashboard](#admin-dashboard)

## Introduction

//TODO: Write a short introduction to the project.

## Technologies Used

- Node.js
- Express.js
- Tailwind CSS

## Members

- Jan
- Jirka

## Setup

Install Node.js and npm from [here](https://nodejs.org/en).

Install all dependencies:

```
npm install
```

Start tailwind watch:

```
npm run dev
```

Start the server:

```
npm run start
```

## Database

[Databáze](http://localhost/phpmyadmin/index.php?route=/database/structure&db=fishing_simulator) -
fishing_simulator

- users
- items
- userItems

### Schema

```sql
CREATE TABLE users (
    id  INT AUTO_INCREMENT PRIMARY KEY ,
    username VARCHAR(60) NOT NULL,
    email VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

```sql
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    category VARCHAR(25) NOT NULL
);
```

```sql
CREATE TABLE userItems  (
    user_item_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);
```

### Items

add items to the items table

```sql
-- Fish Items
INSERT INTO items (name, category) VALUES ('Raw Cod', 'Fish');
INSERT INTO items (name, category) VALUES ('Raw Salmon', 'Fish');
INSERT INTO items (name, category) VALUES ('Tropical Fish', 'Fish');
INSERT INTO items (name, category) VALUES ('Pufferfish', 'Fish');

-- Junk Items
INSERT INTO items (name, category) VALUES ('Lily Pad', 'Junk');
INSERT INTO items (name, category) VALUES ('Bowl', 'Junk');
INSERT INTO items (name, category) VALUES ('Leather', 'Junk');
INSERT INTO items (name, category) VALUES ('Leather Boots', 'Junk');
INSERT INTO items (name, category) VALUES ('Rotten Flesh', 'Junk');
INSERT INTO items (name, category) VALUES ('Stick', 'Junk');
INSERT INTO items (name, category) VALUES ('String', 'Junk');
INSERT INTO items (name, category) VALUES ('Water Bottle', 'Junk');
INSERT INTO items (name, category) VALUES ('Bone', 'Junk');
INSERT INTO items (name, category) VALUES ('Ink Sac', 'Junk');
INSERT INTO items (name, category) VALUES ('Tripwire Hook', 'Junk');

-- Treasure Items
INSERT INTO items (name, category) VALUES ('Enchanted Book', 'Treasure');
INSERT INTO items (name, category) VALUES ('Saddle', 'Treasure');
INSERT INTO items (name, category) VALUES ('Name Tag', 'Treasure');
INSERT INTO items (name, category) VALUES ('Nautilus Shell', 'Treasure');
INSERT INTO items (name, category) VALUES ('Bow', 'Treasure');
INSERT INTO items (name, category) VALUES ('Fishing Rod', 'Treasure');
INSERT INTO items (name, category) VALUES ('Lily Pad', 'Treasure');
```

## ENV Variables

Variables in .env file:<br>

DATABASE = fishing_simulator
<br>DATABASE_HOST = localhost
<br>DATABASE_USER = root
<br>DATABASE_PASSWORD =

SECRET_KEY = my_secure_random_key_12345

## Admin dashboard

Dashboard is available only for admin users.
Admin user is user with id = 1
[Dashboard](http://localhost:3000/dashboard)
