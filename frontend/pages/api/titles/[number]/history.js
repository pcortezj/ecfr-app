import path from 'path';
import Database from 'better-sqlite3';

export default function handler(req, res) {
  const { number } = req.query;
  const dbPath = path.resolve('../backend/ecfr.db');
  const db = new Database(dbPath, { readonly: true });

  const title = db.prepare('SELECT * FROM titles WHERE number = ?').get(number);
  if (!title) {
    db.close();
    return res.status(404).json({ error: 'Title not found' });
  }

  const snapshots = db.prepare(`
    SELECT retrieved_at, word_count, sentence_count, avg_sentence_length, lexical_density
    FROM snapshots
    WHERE title_id = ?
    ORDER BY retrieved_at ASC
  `).all(title.id);

  db.close();

  res.status(200).json(snapshots);
}
