const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Basic health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Placeholder routers (to be implemented)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));

// Initialize DB and start server
const dbModule = require('./db');
dbModule.init()
  .then((db) => {
	app.locals.db = db; // make available to routes via req.app.locals.db
	app.listen(PORT, () => {
	  console.log(`Server listening on http://localhost:${PORT}`);
	});
  })
  .catch((err) => {
	console.error('Failed to initialize database:', err);
	process.exit(1);
  });
