const Database = require('better-sqlite3');
const db = new Database('ecfr.db');

db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  short_name TEXT,
  slug TEXT
);

CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER,
  name TEXT,
  latest_amended_on TEXT,
  latest_issue_date TEXT,
  up_to_date_as_of TEXT,
  reserved INTEGER
);


CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER,
  retrieved_at TEXT,
  raw_text TEXT,
  word_count INTEGER,
  sentence_count INTEGER,
  avg_sentence_length REAL,
  checksum TEXT,
  lexical_density REAL,
  FOREIGN KEY(title_id) REFERENCES titles(id)
);
`);

console.log("DB initialized.");
db.close();
