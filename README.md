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
- Docker
- MariaDB

## Deployment

You can access web [here](https://fishing.honza.space).

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
    category VARCHAR(25) NOT NULL,
    unenchanted_chance FLOAT NOT NULL
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
-- Inserting fish items
INSERT INTO items (name, category, unenchanted_chance) VALUES
('Raw Cod', 'Fish', 51.0),
('Raw Salmon', 'Fish', 21.3),
('Pufferfish', 'Fish', 11.1),
('Tropical Fish', 'Fish', 1.7);

-- Inserting junk items
INSERT INTO items (name, category, unenchanted_chance) VALUES
('Lily Pad', 'Junk', 1.7),
('Bone', 'Junk', 1.0),
('Bowl', 'Junk', 1.0),
('Leather', 'Junk', 1.0),
('Leather Boots', 'Junk', 1.0),
('Rotten Flesh', 'Junk', 1.0),
('Tripwire Hook', 'Junk', 1.0),
('Water Bottle', 'Junk', 1.0),
('Stick', 'Junk', 0.5),
('String', 'Junk', 0.5),
('Fishing Rod', 'Junk', 0.2),
('10x Ink Sac', 'Junk', 0.1);

-- Inserting treasure items
INSERT INTO items (name, category, unenchanted_chance) VALUES
('Enchanted Bow', 'Treasure', 0.8),
('Enchanted Book', 'Treasure', 0.8),
('Enchanted Fishing Rod', 'Treasure', 0.8),
('Name Tag', 'Treasure', 0.8),
('Nautilus Shell', 'Treasure', 0.8),
('Saddle', 'Treasure', 0.8);
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
