# Fishing Simulator

![Raw Cod](/public/images/Raw_Cod.png)

## Table of Contents

- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Members](#members)
- [Setup](#setup)

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

### Scheama

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

## ENV Variables

Variables in .env file:<br>

DATABASE = fishing_simulator
<br>DATABASE_HOST = localhost
<br>DATABASE_USER = root
<br>DATABASE_PASSWORD =

SECRET_KEY = my_secure_random_key_12345
