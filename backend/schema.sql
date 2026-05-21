-- ============================================================
-- CinePass Cinema Booking Database Schema (MySQL)
-- Matches the ER diagram provided
-- ============================================================

CREATE DATABASE IF NOT EXISTS CinePass_DB;
USE CinePass_DB;

-- ─────────────────────────────────────────────
-- BookingWebsite  (ER: Movie Ticket Booking Website)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS BookingWebsite (
  Website_ID   INT AUTO_INCREMENT PRIMARY KEY,
  Website_name VARCHAR(255),
  Website_URL  VARCHAR(500),
  Contact_No   VARCHAR(20)
);

-- ─────────────────────────────────────────────
-- Admin  (ER: Admin entity, "Manage" rel with BookingWebsite)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Admin (
  Admin_ID      INT AUTO_INCREMENT PRIMARY KEY,
  Admin_name    VARCHAR(100) NOT NULL,
  Admin_Role    VARCHAR(50)  NOT NULL DEFAULT 'admin',
  Email         VARCHAR(150) UNIQUE NOT NULL,
  PasswordSalt  VARCHAR(255) NOT NULL,
  PasswordHash  VARCHAR(255) NOT NULL,
  Website_ID    INT,
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Website_ID) REFERENCES BookingWebsite(Website_ID)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────
-- Customer  (ER: Customer entity)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Customer (
  Customer_ID   INT AUTO_INCREMENT PRIMARY KEY,
  F_Name        VARCHAR(100) NOT NULL,
  L_Name        VARCHAR(100),
  Email_ID      VARCHAR(150) UNIQUE NOT NULL,
  Mobile_No     VARCHAR(15),
  Age           INT,
  PasswordSalt  VARCHAR(255) NOT NULL,
  PasswordHash  VARCHAR(255) NOT NULL,
  CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Movie  (ER: Movie entity)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Movie (
  Movie_ID           INT AUTO_INCREMENT PRIMARY KEY,
  Movie_Title        VARCHAR(255) NOT NULL,
  Movie_Description  TEXT,
  Movie_Stars        TEXT,           -- pipe-separated: "Actor1|Actor2"
  Language           VARCHAR(50),
  Show_date          DATE,
  -- Extended fields for frontend compatibility
  Duration           VARCHAR(20),    -- e.g. "2h 34m"
  Image              VARCHAR(500),
  Genre              VARCHAR(255),   -- comma-separated
  Formats            VARCHAR(255),   -- pipe-separated: "IMAX 2D|4DX"
  TrailerLink        VARCHAR(500),
  ComingSoon         TINYINT DEFAULT 0
);

-- ─────────────────────────────────────────────
-- Theatre  (ER: Theatre entity)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Theatre (
  Theatre_ID    INT AUTO_INCREMENT PRIMARY KEY,
  Theatre_Name  VARCHAR(255) NOT NULL,
  Location      VARCHAR(255)
);

-- ─────────────────────────────────────────────
-- Screen  (ER: Screen entity, "Has" rel with Theatre)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Screen (
  Screen_No     INT AUTO_INCREMENT PRIMARY KEY,
  Screen_Name   VARCHAR(100),
  No_of_Seats   INT DEFAULT 150,
  Theatre_ID    INT NOT NULL,
  FOREIGN KEY (Theatre_ID) REFERENCES Theatre(Theatre_ID)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────
-- MovieShow  (ER: Movie Show entity, "Runs In" rel)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MovieShow (
  Show_ID        INT AUTO_INCREMENT PRIMARY KEY,
  Show_starttime TIME NOT NULL,
  Show_endtime   TIME,
  Show_date      DATE,
  Movie_ID       INT NOT NULL,
  Screen_No      INT NOT NULL,
  FOREIGN KEY (Movie_ID)  REFERENCES Movie(Movie_ID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (Screen_No) REFERENCES Screen(Screen_No)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────
-- Tickets  (ER: Tickets entity, "Books" rel with Customer)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Tickets (
  Ticket_No    INT AUTO_INCREMENT PRIMARY KEY,
  Price        DECIMAL(10,2) NOT NULL,
  Seat_No      VARCHAR(10) NOT NULL,
  Show_time    TIME,
  Show_date    DATE,
  Screen_ID    INT,
  Show_ID      INT NOT NULL,
  Customer_ID  INT NOT NULL,
  BookedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (Screen_ID)    REFERENCES Screen(Screen_No)
    ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (Show_ID)      REFERENCES MovieShow(Show_ID)
    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (Customer_ID)  REFERENCES Customer(Customer_ID)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────
-- Seed: Default Booking Website
-- ─────────────────────────────────────────────
INSERT INTO BookingWebsite (Website_name, Website_URL, Contact_No)
VALUES ('Cinema Redefined', 'http://localhost:3000', '+91-9876543210')
ON DUPLICATE KEY UPDATE Website_name = VALUES(Website_name);
