import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
    const { id } = req.query;
    const dbPath = path.resolve('../backend/ecfr.db'); // adjust path
    const db = new Database(dbPath, { readonly: true });

    const title = db.prepare('SELECT * FROM titles WHERE number = ?').get(id);
    if (!title) {
        db.close();
        return res.status(404).json({ error: 'Title not found' });
    }

    const row = db.prepare(`
    SELECT raw_text
    FROM snapshots
    WHERE title_id = ?
  `).get(title.id);

    db.close();

    if (!row) {
        res.status(404).json({ error: 'Snapshot not found' });
        return;
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="title-${id}.txt"`);
    res.status(200).send(row.raw_text);
}
