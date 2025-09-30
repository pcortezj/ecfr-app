import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  try {
    const dbPath = path.resolve('../backend/ecfr.db'); // adjust path
    const db = new Database(dbPath, { readonly: true });

        // Get agencies that have snapshots (metrics)
    const agencies = db.prepare(`
      SELECT
        a.id AS agency_id,
        a.name AS agency_name,
        a.short_name,
        a.slug,
        a.parent_id,
        SUM(s.word_count) AS total_words,
        SUM(s.sentence_count) AS total_sentences,
        AVG(s.avg_sentence_length) AS avg_sentence_length,
        AVG(s.lexical_density) AS avg_lexical_density
      FROM agencies a
      JOIN title_agency ta ON ta.agency_id = a.id
      JOIN snapshots s ON s.title_id = ta.title_id
      GROUP BY a.id
      ORDER BY a.name
    `).all();

    // Attach titles for each agency
    const getTitlesStmt = db.prepare(`
      SELECT t.id, t.number, t.name
      FROM titles t
      JOIN title_agency ta ON ta.title_id = t.id
      WHERE ta.agency_id = ?
      ORDER BY t.number
    `);

    const agenciesWithTitles = agencies.map(a => ({
      ...a,
      titles: getTitlesStmt.all(a.agency_id)
    }));

    db.close();
    res.status(200).json(agenciesWithTitles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve agency metrics' });
  }
}
