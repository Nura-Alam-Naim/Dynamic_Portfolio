// server.js (updated)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');
const path = require('path');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./portfolio.db');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));

app.use(session({
  name: 'portfolio.sid',
  secret: 'change-this-secret-for-lab',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24*60*60*1000,
    httpOnly: true,
    secure: false, 
    sameSite: 'lax'
  }
}));


app.use(express.static(path.join(__dirname, 'public')));


function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}


app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (email, password_hash) VALUES (?,?)`, [email, hash], function(err) {
      if (err) {
        if (err.message && err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Email already used' });
        return res.status(500).json({ error: 'DB error' });
      }
      req.session.userId = this.lastID;
      return res.json({ ok: true });
    });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
});


app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    req.session.userId = row.id;

    res.json({ ok: true });
  });
});


app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not logout' });
    res.clearCookie('portfolio.sid');
    return res.json({ ok: true });
  });
});


app.post('/api/portfolio', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const {
    full_name, contact, photo_base64, bio,
    soft_skills, technical_skills,
    academics, experience, projects
  } = req.body;

  db.get(`SELECT id FROM portfolios WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) {
      db.run(`UPDATE portfolios SET
        full_name=?, contact=?, photo_base64=?, bio=?,
        soft_skills=?, technical_skills=?, academics=?, experience=?, projects=?
        WHERE user_id=?`,
        [full_name, contact, photo_base64, bio, soft_skills, technical_skills, academics, experience, projects, userId],
        function(err2) {
          if (err2) return res.status(500).json({ error: 'DB error' });
          res.json({ ok: true, updated: true });
        });
    } else {
      db.run(`INSERT INTO portfolios
        (user_id, full_name, contact, photo_base64, bio,
         soft_skills, technical_skills, academics, experience, projects)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
         [userId, full_name, contact, photo_base64, bio, soft_skills, technical_skills, academics, experience, projects],
         function(err2) {
           if (err2) return res.status(500).json({ error: 'DB error' });
           res.json({ ok: true, created: true });
         });
    }
  });
});


app.get('/api/portfolio', (req, res) => {
  // if not authenticated, return 401 (client handles it gracefully)
  if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Unauthorized' });
  const userId = req.session.userId;
  db.get(`SELECT * FROM portfolios WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ ok: true, portfolio: row || null });
  });
});

// (Optional) get all portfolios for admin / instructor
app.get('/api/all-portfolios', (req, res) => {
  db.all(`SELECT p.*, u.email FROM portfolios p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ ok: true, portfolios: rows });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
