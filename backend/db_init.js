const Database = require('better-sqlite3');
const db = new Database('ecfr.db');

db.exec(`PRAGMA foreign_keys = ON;`);

db.exec(`
CREATE TABLE IF NOT EXISTS agencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  short_name TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  FOREIGN KEY(parent_id) REFERENCES agencies(id)
);

CREATE TABLE IF NOT EXISTS titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  latest_amended_on TEXT,
  latest_issue_date TEXT,
  up_to_date_as_of TEXT,
  reserved INTEGER DEFAULT 0,
  agency_id INTEGER DEFAULT NULL,
  FOREIGN KEY(agency_id) REFERENCES agencies(id)
);

CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title_id INTEGER NOT NULL,
  retrieved_at TEXT NOT NULL,
  raw_text TEXT,
  word_count INTEGER,
  sentence_count INTEGER,
  avg_sentence_length REAL,
  checksum TEXT,
  lexical_density REAL,
  FOREIGN KEY(title_id) REFERENCES titles(id)
);
CREATE TABLE IF NOT EXISTS title_agency (
  title_id INTEGER NOT NULL,
  agency_id INTEGER NOT NULL,
  PRIMARY KEY (title_id, agency_id),
  FOREIGN KEY(title_id) REFERENCES titles(id),
  FOREIGN KEY(agency_id) REFERENCES agencies(id)
);
`);

console.log("DB initialized with necessary tables.");
db.close();
