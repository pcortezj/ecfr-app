import path from 'path';
import Database from 'better-sqlite3';

export default function handler(req, res) {
  const { number } = req.query;
  const dbPath = path.resolve('../backend/ecfr.db'); // adjust path
  const db = new Database(dbPath, { readonly: true });

  const title = db.prepare('SELECT * FROM titles WHERE number = ?').get(number);
  if (!title) {
    db.close();
    return res.status(404).json({ error: 'Title not found' });
  }

  const snapshot = db.prepare(`
    SELECT raw_text 
    FROM snapshots 
    WHERE title_id = ? 
    ORDER BY retrieved_at DESC 
    LIMIT 1
  `).get(title.id);

  db.close();

  if (!snapshot) {
    return res.status(404).json({ error: 'No snapshot found' });
  }

  res.status(200).json({ raw_text: snapshot.raw_text });
}
