const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = function authRoutes(db) {
  const router = express.Router();

  router.post('/signup', (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name, email.toLowerCase(), passwordHash);

    const userId = info.lastInsertRowid;
    const token = jwt.sign({ userId, email: email.toLowerCase(), name }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d'
    });
    res.json({ token, user: { id: userId, name, email: email.toLowerCase() } });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'dev_secret', {
      expiresIn: '7d'
    });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });

  return router;
};


