import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing agency ID' });

  const dbPath = path.resolve('../backend/ecfr.db');
  const db = new Database(dbPath, { readonly: true });

  try {
    // Fetch agency details
    const agency = db
      .prepare('SELECT id, name AS agency_name, short_name, slug FROM agencies WHERE id = ?')
      .get(id);

    if (!agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Fetch titles linked to this agency
    const titles = db
      .prepare(`
        SELECT id, number, name, latest_amended_on, latest_issue_date, up_to_date_as_of, reserved
        FROM titles
        WHERE agency_id = ?
        ORDER BY number
      `)
      .all(id);

    res.status(200).json({ agency, titles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
}
