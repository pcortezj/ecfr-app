// pages/api/titles.js
import Database from 'better-sqlite3';

export default function handler(req, res) {
  const db = new Database('../backend/ecfr.db', { readonly: true });
  const titles = db.prepare('SELECT * FROM titles ORDER BY number').all();
  db.close();
  res.status(200).json(titles);
}
