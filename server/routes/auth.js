const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Register: create user and wallet
router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  try {
	const hash = await bcrypt.hash(password, 10);
	db.run('INSERT INTO users (email, password_hash) VALUES (?,?)', [email, hash], function (err) {
	  if (err) return res.status(400).json({ error: 'Email möglicherweise bereits registriert' });
	  const userId = this.lastID;
	  db.run('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [userId, 1000], (err2) => {
		if (err2) return res.status(500).json({ error: 'Fehler beim Anlegen des Wallets' });
		const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
		res.json({ token });
	  });
	});
  } catch (ex) {
	res.status(500).json({ error: 'Serverfehler' });
  }
});

// Login: verify and return token
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  db.get('SELECT id, password_hash FROM users WHERE email = ?', [email], async (err, row) => {
	if (err) return res.status(500).json({ error: 'DB-Fehler' });
	if (!row) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
	const ok = await bcrypt.compare(password, row.password_hash);
	if (!ok) return res.status(401).json({ error: 'Ungültige Zugangsdaten' });
	const token = jwt.sign({ userId: row.id }, JWT_SECRET, { expiresIn: '7d' });
	res.json({ token });
  });
});

module.exports = router;
