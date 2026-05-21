import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'CinePass_DB';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
const AUTH_SECRET = process.env.AUTH_SECRET || 'cinepass-dev-secret';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cinema.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

const DATA_PATH = path.join(process.cwd(), 'backend', 'data', 'movies.json');

// ─────────────────────────────────────────────
// MySQL Connection Pool
// ─────────────────────────────────────────────
let pool;

async function initDatabase() {
  // Always force SSL for cloud databases (Aiven requires it)
  const sslConfig = { rejectUnauthorized: false };

  // Connect directly to the database.
  // We use connectionLimit: 1 for Serverless functions to prevent
  // exhausting the Aiven free tier connection limits on cold starts.
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    ssl: sslConfig,
    connectTimeout: 5000,
    waitForConnections: true,
    connectionLimit: 10,
  });

  console.log(`✅ Connected to MySQL database: ${DB_NAME}`);
}

// ─────────────────────────────────────────────
// Auto-create schema on startup
// ─────────────────────────────────────────────
async function ensureSchema() {
  // BookingWebsite
  await pool.query(`CREATE TABLE IF NOT EXISTS BookingWebsite (
    Website_ID   INT AUTO_INCREMENT PRIMARY KEY,
    Website_name VARCHAR(255),
    Website_URL  VARCHAR(500),
    Contact_No   VARCHAR(20)
  )`);

  // Admin
  await pool.query(`CREATE TABLE IF NOT EXISTS Admin (
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
  )`);

  // Customer
  await pool.query(`CREATE TABLE IF NOT EXISTS Customer (
    Customer_ID   INT AUTO_INCREMENT PRIMARY KEY,
    F_Name        VARCHAR(100) NOT NULL,
    L_Name        VARCHAR(100),
    Email_ID      VARCHAR(150) UNIQUE NOT NULL,
    Mobile_No     VARCHAR(15),
    Age           INT,
    PasswordSalt  VARCHAR(255) NOT NULL,
    PasswordHash  VARCHAR(255) NOT NULL,
    CreatedAt     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // Movie
  await pool.query(`CREATE TABLE IF NOT EXISTS Movie (
    Movie_ID           INT AUTO_INCREMENT PRIMARY KEY,
    Movie_Title        VARCHAR(255) NOT NULL,
    Movie_Description  TEXT,
    Movie_Stars        TEXT,
    Language           VARCHAR(50),
    Show_date          DATE,
    Duration           VARCHAR(20),
    Image              VARCHAR(500),
    Genre              VARCHAR(255),
    Formats            VARCHAR(255),
    TrailerLink        VARCHAR(500),
    ComingSoon         TINYINT DEFAULT 0
  )`);

  // Theatre
  await pool.query(`CREATE TABLE IF NOT EXISTS Theatre (
    Theatre_ID    INT AUTO_INCREMENT PRIMARY KEY,
    Theatre_Name  VARCHAR(255) NOT NULL,
    Location      VARCHAR(255)
  )`);

  // Screen
  await pool.query(`CREATE TABLE IF NOT EXISTS Screen (
    Screen_No     INT AUTO_INCREMENT PRIMARY KEY,
    Screen_Name   VARCHAR(100),
    No_of_Seats   INT DEFAULT 150,
    Theatre_ID    INT NOT NULL,
    FOREIGN KEY (Theatre_ID) REFERENCES Theatre(Theatre_ID)
      ON DELETE CASCADE ON UPDATE CASCADE
  )`);

  // MovieShow
  await pool.query(`CREATE TABLE IF NOT EXISTS MovieShow (
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
  )`);

  // Tickets
  await pool.query(`CREATE TABLE IF NOT EXISTS Tickets (
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
  )`);

  console.log('✅ All tables ensured');
}

// ─────────────────────────────────────────────
// Seed default data
// ─────────────────────────────────────────────
async function seedDefaults() {
  // Seed booking website
  const [websites] = await pool.query('SELECT * FROM BookingWebsite LIMIT 1');
  if (!websites.length) {
    await pool.query(
      'INSERT INTO BookingWebsite (Website_name, Website_URL, Contact_No) VALUES (?, ?, ?)',
      ['Cinema Redefined', 'http://localhost:3000', '+91-9876543210']
    );
  }

  // Seed admin
  const [admins] = await pool.query('SELECT * FROM Admin WHERE Email = ?', [ADMIN_EMAIL]);
  const { salt: adminSalt, hash: adminHash } = hashPassword(ADMIN_PASSWORD);
  if (admins.length) {
    await pool.query(
      'UPDATE Admin SET Admin_name = ?, PasswordSalt = ?, PasswordHash = ? WHERE Email = ?',
      ['Main Admin', adminSalt, adminHash, ADMIN_EMAIL]
    );
  } else {
    await pool.query(
      'INSERT INTO Admin (Admin_name, Admin_Role, Email, PasswordSalt, PasswordHash, Website_ID) VALUES (?, ?, ?, ?, ?, ?)',
      ['Main Admin', 'admin', ADMIN_EMAIL, adminSalt, adminHash, 1]
    );
  }

  // Seed movies from JSON
  await syncMovieSeeds();

  // Seed theatres
  await seedTheatres();

  console.log('✅ Default data seeded');
}

function loadStaticMovies() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function syncMovieSeeds() {
  const movies = loadStaticMovies();
  for (const m of movies) {
    const [existing] = await pool.query(
      'SELECT Movie_ID FROM Movie WHERE Movie_Title = ? LIMIT 1',
      [m.title]
    );
    if (existing.length) continue;

    await pool.query(
      `INSERT INTO Movie (Movie_Title, Movie_Description, Movie_Stars, Language, Duration, Image, Genre, Formats, TrailerLink, ComingSoon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        m.title,
        m.synopsis || null,
        Array.isArray(m.cast) ? m.cast.join('|') : null,
        m.language || 'English',
        m.time || null,
        m.image || null,
        Array.isArray(m.genres) ? m.genres.join(',') : null,
        Array.isArray(m.formats) ? m.formats.join('|') : null,
        m.trailerLink || null,
        m.comingSoon ? 1 : 0,
      ]
    );
  }
}

async function seedTheatres() {
  const [existing] = await pool.query('SELECT COUNT(*) as cnt FROM Theatre');
  if (existing[0].cnt > 0) return;

  const theatres = [
    { name: 'Cinepolis Orion Avenue Mall', location: 'Banaswadi, Bengaluru' },
    { name: 'INOX Lido Mall', location: 'Ulsoor, Bengaluru' },
    { name: 'Newfangled Miniplex', location: 'MG Road, Bengaluru' },
    { name: 'INOX Garuda Mall', location: 'Magrath Road, Bengaluru' },
    { name: 'PVR Phoenix Marketcity', location: 'Whitefield, Bengaluru' },
  ];

  for (const t of theatres) {
    const [result] = await pool.query(
      'INSERT INTO Theatre (Theatre_Name, Location) VALUES (?, ?)',
      [t.name, t.location]
    );
    const theatreId = result.insertId;

    // Create screens for each theatre
    const screenCount = 3 + Math.floor(Math.random() * 3); // 3-5 screens
    for (let s = 1; s <= screenCount; s++) {
      const seats = 100 + Math.floor(Math.random() * 150); // 100-250 seats
      await pool.query(
        'INSERT INTO Screen (Screen_Name, No_of_Seats, Theatre_ID) VALUES (?, ?, ?)',
        [`Screen ${s}`, seats, theatreId]
      );
    }
  }

  // Create some movie shows
  const [movies] = await pool.query('SELECT Movie_ID FROM Movie WHERE ComingSoon = 0');
  const [screens] = await pool.query('SELECT Screen_No FROM Screen');
  const showtimes = ['09:30', '12:45', '16:00', '19:15', '22:00'];

  for (const movie of movies) {
    // Assign 2-3 random screens
    const shuffled = screens.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const screen of shuffled) {
      const startIdx = Math.floor(Math.random() * 2);
      const endIdx = startIdx + 2 + Math.floor(Math.random() * 2);
      for (let i = startIdx; i < Math.min(endIdx, showtimes.length); i++) {
        const [h, m] = showtimes[i].split(':').map(Number);
        const endH = h + 2 + Math.floor(Math.random() * 1);
        const endM = m + Math.floor(Math.random() * 30);
        await pool.query(
          `INSERT INTO MovieShow (Show_starttime, Show_endtime, Show_date, Movie_ID, Screen_No)
           VALUES (?, ?, CURDATE(), ?, ?)`,
          [
            showtimes[i] + ':00',
            `${String(endH).padStart(2, '0')}:${String(endM % 60).padStart(2, '0')}:00`,
            movie.Movie_ID,
            screen.Screen_No,
          ]
        );
      }
    }
  }
}

// ─────────────────────────────────────────────
// Password Hashing (PBKDF2)
// ─────────────────────────────────────────────
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password, salt, hash) {
  const derived = crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

// ─────────────────────────────────────────────
// Token helpers (HMAC-based JWT-like tokens)
// ─────────────────────────────────────────────
function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function unbase64Url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function signToken(payload) {
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  if (signature !== expected) return null;
  const payload = JSON.parse(unbase64Url(body));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

function authTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────
// Auth Middleware
// ─────────────────────────────────────────────
function requireAuth(req, res, next) {
  const payload = verifyToken(authTokenFromHeader(req));
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = payload;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ─────────────────────────────────────────────
// Express App
// ─────────────────────────────────────────────
const app = express();
app.use(express.json());

// ═══════════════════════════════════════════════
// DATABASE INITIALIZATION MIDDLEWARE
// ═══════════════════════════════════════════════
let isInitialized = false;

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && !isInitialized) {
    try {
      if (!pool) await initDatabase();
      isInitialized = true;
    } catch (err) {
      console.error('Database init failed on request:', err);
      return res.status(500).json({ error: 'Database init failed', details: err.message, stack: err.stack });
    }
  }
  next();
});

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ═══════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════

// Register customer
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, age } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const [existing] = await pool.query('SELECT Customer_ID FROM Customer WHERE Email_ID = ?', [email]);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const { salt, hash } = hashPassword(password);
    const nameParts = (name || '').split(' ');
    const fName = nameParts[0] || 'User';
    const lName = nameParts.slice(1).join(' ') || null;

    const [result] = await pool.query(
      'INSERT INTO Customer (F_Name, L_Name, Email_ID, Mobile_No, Age, PasswordSalt, PasswordHash) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [fName, lName, email, phone || null, age || null, salt, hash]
    );

    const token = signToken({
      id: result.insertId,
      email,
      role: 'customer',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: { id: result.insertId, email, name: name || fName, role: 'customer' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (supports both Customer and Admin)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.error(`[DIAGNOSTICS] Login attempt received. Email: '${email}', Password length: ${password?.length}, Password chars: '${password}'`);
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Check admin first
    const [admins] = await pool.query(
      'SELECT Admin_ID, Admin_name, Email, PasswordSalt, PasswordHash, Admin_Role FROM Admin WHERE Email = ?',
      [email]
    );
    if (admins.length) {
      const admin = admins[0];
      if (!verifyPassword(password, admin.PasswordSalt, admin.PasswordHash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = signToken({
        id: admin.Admin_ID,
        email: admin.Email,
        role: 'admin',
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
      return res.json({
        token,
        user: { id: admin.Admin_ID, email: admin.Email, name: admin.Admin_name, role: 'admin' },
      });
    }

    // Check customer
    const [customers] = await pool.query(
      'SELECT Customer_ID, F_Name, L_Name, Email_ID, PasswordSalt, PasswordHash FROM Customer WHERE Email_ID = ?',
      [email]
    );
    if (!customers.length) return res.status(401).json({ error: 'Invalid credentials' });

    const customer = customers[0];
    if (!verifyPassword(password, customer.PasswordSalt, customer.PasswordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({
      id: customer.Customer_ID,
      email: customer.Email_ID,
      role: 'customer',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const fullName = [customer.F_Name, customer.L_Name].filter(Boolean).join(' ');
    res.json({
      token,
      user: { id: customer.Customer_ID, email: customer.Email_ID, name: fullName, role: 'customer' },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const [rows] = await pool.query('SELECT Admin_ID, Admin_name, Email, Admin_Role FROM Admin WHERE Admin_ID = ?', [req.user.id]);
      if (!rows.length) return res.status(404).json({ error: 'Admin not found' });
      const admin = rows[0];
      return res.json({ id: admin.Admin_ID, email: admin.Email, name: admin.Admin_name, role: 'admin' });
    }

    const [rows] = await pool.query(
      'SELECT Customer_ID, F_Name, L_Name, Email_ID FROM Customer WHERE Customer_ID = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const c = rows[0];
    res.json({
      id: c.Customer_ID,
      email: c.Email_ID,
      name: [c.F_Name, c.L_Name].filter(Boolean).join(' '),
      role: 'customer',
    });
  } catch (err) {
    console.error('Auth/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ═══════════════════════════════════════════════
// MOVIE ROUTES
// ═══════════════════════════════════════════════

// Get all movies
app.get('/api/movies', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Movie ORDER BY Movie_ID');
    const movies = rows.map(formatMovieRow);
    res.json(movies);
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ error: 'Failed to fetch movies', details: err.message, code: err.code });
  }
});

// Get single movie
app.get('/api/movies/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Movie WHERE Movie_ID = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Movie not found' });
    res.json(formatMovieRow(rows[0]));
  } catch (err) {
    console.error('Get movie error:', err);
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

function formatMovieRow(row) {
  return {
    id: row.Movie_ID,
    title: row.Movie_Title,
    synopsis: row.Movie_Description,
    cast: row.Movie_Stars ? row.Movie_Stars.split('|') : [],
    language: row.Language,
    time: row.Duration,
    image: row.Image,
    genres: row.Genre ? row.Genre.split(',') : [],
    formats: row.Formats ? row.Formats.split('|') : [],
    trailerLink: row.TrailerLink,
    comingSoon: row.ComingSoon === 1,
    showDate: row.Show_date,
  };
}

// ═══════════════════════════════════════════════
// DATABASE INIT ROUTE (Temporary for Vercel)
// ═══════════════════════════════════════════════
app.get('/api/init-db', async (req, res) => {
  try {
    if (!process.env.DB_HOST) {
      return res.status(500).json({ error: 'DB_HOST is completely missing from process.env! Vercel did not load the variables.' });
    }
    
    await ensureSchema();
    await seedDefaults();
    res.json({ 
      success: true, 
      message: 'Remote database fully initialized!',
      host: process.env.DB_HOST
    });
  } catch (err) {
    console.error('Init DB Error:', err);
    res.status(500).json({ error: err.message, stack: err.stack, host: process.env.DB_HOST });
  }
});

// ═══════════════════════════════════════════════
// THEATRE & SCREEN ROUTES
// ═══════════════════════════════════════════════

// Get all theatres with screens
app.get('/api/theatres', async (req, res) => {
  try {
    const [theatres] = await pool.query('SELECT * FROM Theatre ORDER BY Theatre_ID');
    const result = [];
    for (const t of theatres) {
      const [screens] = await pool.query('SELECT * FROM Screen WHERE Theatre_ID = ?', [t.Theatre_ID]);
      result.push({
        id: t.Theatre_ID,
        name: t.Theatre_Name,
        location: t.Location,
        screens: screens.map(s => ({
          screenNo: s.Screen_No,
          name: s.Screen_Name,
          seats: s.No_of_Seats,
        })),
      });
    }
    res.json(result);
  } catch (err) {
    console.error('Get theatres error:', err);
    res.status(500).json({ error: 'Failed to fetch theatres' });
  }
});

// ═══════════════════════════════════════════════
// SHOW ROUTES
// ═══════════════════════════════════════════════

// Get shows for a movie
app.get('/api/shows/:movieId', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ms.*, s.Screen_Name, s.No_of_Seats, s.Theatre_ID,
              t.Theatre_Name, t.Location
       FROM MovieShow ms
       JOIN Screen s ON ms.Screen_No = s.Screen_No
       JOIN Theatre t ON s.Theatre_ID = t.Theatre_ID
       WHERE ms.Movie_ID = ?
       ORDER BY ms.Show_starttime`,
      [req.params.movieId]
    );
    res.json(rows.map(r => ({
      showId: r.Show_ID,
      startTime: r.Show_starttime,
      endTime: r.Show_endtime,
      showDate: r.Show_date,
      screenName: r.Screen_Name,
      screenNo: r.Screen_No,
      totalSeats: r.No_of_Seats,
      theatreId: r.Theatre_ID,
      theatreName: r.Theatre_Name,
      location: r.Location,
    })));
  } catch (err) {
    console.error('Get shows error:', err);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// ═══════════════════════════════════════════════
// BOOKING ROUTES
// ═══════════════════════════════════════════════

// Create booking (creates ticket records)
app.post('/api/bookings', requireAuth, async (req, res) => {
  try {
    const { showId, movieId, theatreName, showTime, showDate, seats, totalPrice } = req.body;
    // seats: [{ seatNo: "A1", price: 350 }, ...]

    if (!seats || !seats.length) {
      return res.status(400).json({ error: 'Seats are required' });
    }

    let actualShowId = showId;
    let show = null;

    if (movieId) {
      const searchName = theatreName ? theatreName.split(',')[0].trim() : '';
      let [shows] = await pool.query(
        `SELECT ms.* 
         FROM MovieShow ms
         JOIN Screen s ON ms.Screen_No = s.Screen_No
         JOIN Theatre t ON s.Theatre_ID = t.Theatre_ID
         WHERE ms.Movie_ID = ? AND t.Theatre_Name LIKE ? LIMIT 1`,
        [movieId, `%${searchName}%`]
      );
      if (shows.length === 0) {
        // Fallback to ANY show for this movie
        [shows] = await pool.query(`SELECT * FROM MovieShow WHERE Movie_ID = ? LIMIT 1`, [movieId]);
      }
      if (shows.length > 0) {
        show = shows[0];
        actualShowId = show.Show_ID;
      }
    }

    if (!show) {
      const [shows] = await pool.query(
        'SELECT * FROM MovieShow WHERE Show_ID = ?',
        [actualShowId || 1]
      );
      if (!shows.length) return res.status(404).json({ error: 'Show not found' });
      show = shows[0];
      actualShowId = show.Show_ID;
    }

    const customerId = req.user.id;
    const ticketNumbers = [];

    let finalTime = show.Show_starttime;
    if (showTime) {
      const timeParts = showTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1], 10);
        const minutes = timeParts[2];
        const ampm = timeParts[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        finalTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
      }
    }

    let finalDate = show.Show_date || new Date().toISOString().split('T')[0];
    if (showDate) {
      const dateMatch = showDate.match(/(\d{1,2})\s+([A-Za-z]+)/);
      if (dateMatch) {
        const day = dateMatch[1];
        const monthStr = dateMatch[2];
        const currentYear = new Date().getFullYear();
        const parsedDate = new Date(`${day} ${monthStr} ${currentYear} 12:00:00Z`);
        if (!isNaN(parsedDate.getTime())) {
          finalDate = parsedDate.toISOString().split('T')[0];
        }
      }
    }

    for (const seat of seats) {
      const [result] = await pool.query(
        `INSERT INTO Tickets (Price, Seat_No, Show_time, Show_date, Screen_ID, Show_ID, Customer_ID)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          seat.price,
          seat.seatNo,
          finalTime,
          finalDate,
          show.Screen_No,
          actualShowId,
          customerId,
        ]
      );
      ticketNumbers.push(result.insertId);
    }

    res.json({
      success: true,
      bookingId: `CRD${ticketNumbers[0]}`,
      ticketNumbers,
      totalPrice,
      message: 'Booking confirmed!',
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// Get bookings for a customer
app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, m.Movie_Title, m.Image, m.Duration, th.Theatre_Name, s.Screen_Name
       FROM Tickets t
       JOIN MovieShow ms ON t.Show_ID = ms.Show_ID
       JOIN Movie m ON ms.Movie_ID = m.Movie_ID
       JOIN Screen s ON t.Screen_ID = s.Screen_No
       JOIN Theatre th ON s.Theatre_ID = th.Theatre_ID
       WHERE t.Customer_ID = ?
       ORDER BY t.BookedAt DESC`,
      [req.user.id]
    );
    res.json(rows.map(r => ({
      ticketNo: r.Ticket_No,
      price: r.Price,
      seatNo: r.Seat_No,
      showTime: r.Show_time,
      showDate: r.Show_date,
      movieTitle: r.Movie_Title,
      movieImage: r.Image,
      duration: r.Duration,
      theatreName: r.Theatre_Name,
      screenName: r.Screen_Name,
      bookedAt: r.BookedAt,
    })));
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ═══════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════

// Admin: Add movie
app.post('/api/admin/movies', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, stars, language, duration, image, genre, formats, trailerLink, comingSoon } = req.body;
    const [result] = await pool.query(
      `INSERT INTO Movie (Movie_Title, Movie_Description, Movie_Stars, Language, Duration, Image, Genre, Formats, TrailerLink, ComingSoon)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, stars, language, duration, image, genre, formats, trailerLink, comingSoon ? 1 : 0]
    );
    res.json({ id: result.insertId, message: 'Movie added' });
  } catch (err) {
    console.error('Admin add movie error:', err);
    res.status(500).json({ error: 'Failed to add movie' });
  }
});

// Admin: Update movie
app.put('/api/admin/movies/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, stars, language, duration, image, genre, formats, trailerLink, comingSoon } = req.body;
    await pool.query(
      `UPDATE Movie SET Movie_Title=?, Movie_Description=?, Movie_Stars=?, Language=?, Duration=?, Image=?, Genre=?, Formats=?, TrailerLink=?, ComingSoon=?
       WHERE Movie_ID=?`,
      [title, description, stars, language, duration, image, genre, formats, trailerLink, comingSoon ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Movie updated' });
  } catch (err) {
    console.error('Admin update movie error:', err);
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

// Admin: Delete movie
app.delete('/api/admin/movies/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM Movie WHERE Movie_ID = ?', [req.params.id]);
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    console.error('Admin delete movie error:', err);
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

// Admin: Add theatre
app.post('/api/admin/theatres', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, location } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Theatre (Theatre_Name, Location) VALUES (?, ?)',
      [name, location]
    );
    res.json({ id: result.insertId, message: 'Theatre added' });
  } catch (err) {
    console.error('Admin add theatre error:', err);
    res.status(500).json({ error: 'Failed to add theatre' });
  }
});

// Admin: Add screen to theatre
app.post('/api/admin/screens', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, seats, theatreId } = req.body;
    const [result] = await pool.query(
      'INSERT INTO Screen (Screen_Name, No_of_Seats, Theatre_ID) VALUES (?, ?, ?)',
      [name, seats || 150, theatreId]
    );
    res.json({ id: result.insertId, message: 'Screen added' });
  } catch (err) {
    console.error('Admin add screen error:', err);
    res.status(500).json({ error: 'Failed to add screen' });
  }
});

// Admin: Add show
app.post('/api/admin/shows', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { startTime, endTime, showDate, movieId, screenNo } = req.body;
    const [result] = await pool.query(
      'INSERT INTO MovieShow (Show_starttime, Show_endtime, Show_date, Movie_ID, Screen_No) VALUES (?, ?, ?, ?, ?)',
      [startTime, endTime, showDate, movieId, screenNo]
    );
    res.json({ id: result.insertId, message: 'Show added' });
  } catch (err) {
    console.error('Admin add show error:', err);
    res.status(500).json({ error: 'Failed to add show' });
  }
});

// Admin: Get all bookings
app.get('/api/admin/bookings', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, c.F_Name, c.L_Name, c.Email_ID, m.Movie_Title, th.Theatre_Name, s.Screen_Name
       FROM Tickets t
       JOIN Customer c ON t.Customer_ID = c.Customer_ID
       JOIN MovieShow ms ON t.Show_ID = ms.Show_ID
       JOIN Movie m ON ms.Movie_ID = m.Movie_ID
       JOIN Screen s ON t.Screen_ID = s.Screen_No
       JOIN Theatre th ON s.Theatre_ID = th.Theatre_ID
       ORDER BY t.BookedAt DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin get bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Admin: Get all customers
app.get('/api/admin/customers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Customer_ID, F_Name, L_Name, Email_ID, Mobile_No, Age, CreatedAt FROM Customer ORDER BY CreatedAt DESC');
    res.json(rows);
  } catch (err) {
    console.error('Admin get customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Admin: Get all admins
app.get('/api/admin/admins', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT Admin_ID, Admin_name, Admin_Role, Email, Website_ID, CreatedAt FROM Admin ORDER BY CreatedAt DESC');
    res.json(rows);
  } catch (err) {
    console.error('Admin get admins error:', err);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Admin: Get all shows
app.get('/api/admin/shows', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT ms.*, m.Movie_Title, s.Screen_Name, t.Theatre_Name
      FROM MovieShow ms
      JOIN Movie m ON ms.Movie_ID = m.Movie_ID
      JOIN Screen s ON ms.Screen_No = s.Screen_No
      JOIN Theatre t ON s.Theatre_ID = t.Theatre_ID
      ORDER BY ms.Show_date DESC, ms.Show_starttime DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Admin get shows error:', err);
    res.status(500).json({ error: 'Failed to fetch shows' });
  }
});

// Admin: Get website info
app.get('/api/admin/website', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM BookingWebsite LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Admin get website error:', err);
    res.status(500).json({ error: 'Failed to fetch website info' });
  }
});



// Admin: Get dashboard stats
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [[{ movieCount }]] = await pool.query('SELECT COUNT(*) as movieCount FROM Movie');
    const [[{ theatreCount }]] = await pool.query('SELECT COUNT(*) as theatreCount FROM Theatre');
    const [[{ customerCount }]] = await pool.query('SELECT COUNT(*) as customerCount FROM Customer');
    const [[{ bookingCount }]] = await pool.query('SELECT COUNT(*) as bookingCount FROM Tickets');
    const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(Price), 0) as totalRevenue FROM Tickets');

    res.json({ movieCount, theatreCount, customerCount, bookingCount, totalRevenue });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ═══════════════════════════════════════════════
// Serve static frontend in production
// ═══════════════════════════════════════════════
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// ═══════════════════════════════════════════════
// Start server or Export for Serverless
// ═══════════════════════════════════════════════

async function start() {
  try {
    await initDatabase();
    await ensureSchema();
    await seedDefaults();

    app.listen(PORT, () => {
      console.log(`\n🎬 CinePass server running on http://localhost:${PORT}`);
      console.log(`   Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}`);
      console.log(`   Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('   Make sure MySQL is running and credentials are correct.');
    process.exit(1);
  }
}

// Start server locally, but skip app.listen if running in Vercel
if (!process.env.VERCEL) {
  start();
}

export default app;
