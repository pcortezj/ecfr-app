import Database from 'better-sqlite3';
import path from 'path';

export default function handler(req, res) {
  try {
    const dbPath = path.resolve('../backend/ecfr.db'); // adjust path
    const db = new Database(dbPath, { readonly: true });

    // Aggregate metrics per agency but only include agencies with snapshots
    const stmt = db.prepare(`
      SELECT 
        a.id AS agency_id,
        a.name AS agency_name,
        SUM(s.word_count) AS total_words,
        SUM(s.sentence_count) AS total_sentences,
        AVG(s.avg_sentence_length) AS avg_sentence_length,
        AVG(s.lexical_density) AS avg_lexical_density
      FROM agencies a
      JOIN titles t ON t.agency_id = a.id
      JOIN snapshots s ON s.title_id = t.id
      GROUP BY a.id, a.name
      HAVING SUM(s.word_count) > 0
      ORDER BY total_words DESC
    `);

    const agencyMetrics = stmt.all();

    db.close();
    res.status(200).json(agencyMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve agency metrics' });
  }
}
