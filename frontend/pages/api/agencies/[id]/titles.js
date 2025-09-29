import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  const { id } = req.query; // matches [id].js
  try {
    const dbPath = path.resolve('../backend/ecfr.db');
    const db = new Database(dbPath, { readonly: true });
    
    const stmt = db.prepare(`
      SELECT *
      FROM titles
      WHERE agency_id = ?
      ORDER BY number
    `);
    const titles = stmt.all(id);

    db.close();
    res.status(200).json(titles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch titles' });
  }
}
