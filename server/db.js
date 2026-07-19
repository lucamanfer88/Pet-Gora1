const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'db');
const DB_FILE = path.join(DB_DIR, 'database.sqlite');
const SCHEMA_FILE = path.join(__dirname, '..', 'db', 'schema.sql');

function init() {
  return new Promise((resolve, reject) => {
	try {
	  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
	  const schema = fs.existsSync(SCHEMA_FILE) ? fs.readFileSync(SCHEMA_FILE, 'utf8') : '';
	  const db = new sqlite3.Database(DB_FILE, (err) => {
		if (err) return reject(err);
		if (schema && schema.trim().length > 0) {
		  db.exec(schema, (err2) => {
			if (err2) return reject(err2);
			resolve(db);
		  });
		} else {
		  resolve(db);
		}
	  });
	} catch (ex) {
	  reject(ex);
	}
  });
}

module.exports = { init };
