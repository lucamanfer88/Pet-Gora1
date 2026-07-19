const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Auth helper
function getUserIdFromToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(' ')[1];
  if (!token) return null;
  try {
	const jwt = require('jsonwebtoken');
	const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
	return decoded.userId;
  } catch (ex) {
	return null;
  }
}

// Simple coinflip endpoint (virtual currency)
router.post('/coinflip', async (req, res) => {
  const { side, amount } = req.body || {};
  if (!side || !amount) return res.status(400).json({ error: 'Missing side or amount' });
  const userId = getUserIdFromToken(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const db = req.app.locals.db;

  // atomic-ish: check balance, record bet, update wallet
  db.get('SELECT balance FROM wallets WHERE user_id = ?', [userId], (err, row) => {
	if (err) return res.status(500).json({ error: 'DB-Fehler' });
	if (!row || row.balance < amount) return res.status(400).json({ error: 'Unzureichendes Guthaben' });

	// secure RNG
	const rnd = crypto.randomBytes(1)[0] % 2;
	const result = rnd === 0 ? 'heads' : 'tails';
	const win = result === side ? 1 : 0;
	const delta = win ? amount : -amount;

	db.run('BEGIN TRANSACTION');
	db.run('INSERT INTO bets (user_id, amount, choice, result, win) VALUES (?,?,?,?,?)', [userId, amount, side, result, win], function (err2) {
	  if (err2) {
		db.run('ROLLBACK');
		return res.status(500).json({ error: 'Fehler beim Speichern der Wette' });
	  }
	  db.run('UPDATE wallets SET balance = balance + ? WHERE user_id = ?', [delta, userId], function (err3) {
		if (err3) {
		  db.run('ROLLBACK');
		  return res.status(500).json({ error: 'Fehler beim Aktualisieren des Guthabens' });
		}
		db.run('COMMIT');
		return res.json({ result, win: !!win });
	  });
	});
  });
});

module.exports = router;
