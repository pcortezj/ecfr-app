import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing agency ID' });

  try {
    const dbPath = path.resolve('../backend/ecfr.db');
    const db = new Database(dbPath, { readonly: true });

    // Query via join table
    const stmt = db.prepare(`
      SELECT t.id, t.number, t.name, 
             t.latest_amended_on, t.latest_issue_date, 
             t.up_to_date_as_of, t.reserved
      FROM titles t
      JOIN title_agency ta ON t.id = ta.title_id
      WHERE ta.agency_id = ?
      ORDER BY t.number
    `);

    const titles = stmt.all(id);

    db.close();
    res.status(200).json(titles);
  } catch (err) {
    console.error('Error fetching titles for agency', id, err);
    res.status(500).json({ error: 'Failed to fetch titles' });
  }
}
