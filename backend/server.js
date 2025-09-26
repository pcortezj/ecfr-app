const express = require('express');
const Database = require('better-sqlite3');
const app = express();
const db = new Database('ecfr.db');

app.use(express.json());

// List agencies
app.get('/api/agencies', (req, res) => {
  const rows = db.prepare('SELECT * FROM agencies').all();
  res.json(rows);
});

// List titles
app.get('/api/titles', (req, res) => {
  const rows = db.prepare('SELECT * FROM titles').all();
  res.json(rows);
});

// Latest metrics per title
app.get('/api/titles/:number/metrics', (req, res) => {
  const number = Number(req.params.number);
  const row = db.prepare(`
    SELECT * FROM snapshots 
    WHERE title_id = (SELECT id FROM titles WHERE number = ?) 
    ORDER BY retrieved_at DESC LIMIT 1
  `).get(number);
  if (!row) return res.status(404).json({ error: 'No snapshot found' });
  res.json(row);
});

// History per title
app.get('/api/titles/:number/history', (req, res) => {
  const number = Number(req.params.number);
  const rows = db.prepare(`
    SELECT retrieved_at, word_count, avg_sentence_length, checksum, lexical_density 
    FROM snapshots
    WHERE title_id = (SELECT id FROM titles WHERE number = ?)
    ORDER BY retrieved_at
  `).all(number);
  res.json(rows);
});

// Raw text per title
app.get('/api/titles/:number/raw', (req, res) => {
  const number = Number(req.params.number);
  const row = db.prepare(`
    SELECT raw_text FROM snapshots 
    WHERE title_id = (SELECT id FROM titles WHERE number = ?) 
    ORDER BY retrieved_at DESC LIMIT 1
  `).get(number);
  if (!row) return res.status(404).send('No text found');
  res.type('text/plain').send(row.raw_text);
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
