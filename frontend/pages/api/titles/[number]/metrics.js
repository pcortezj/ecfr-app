// pages/api/titles/[number]/metrics.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { number } = req.query;

  try {
    // Step 1: Find the title by number
    const { data: title, error: titleError } = await supabase
      .from('titles')
      .select('*')
      .eq('number', number)
      .single();

    if (titleError || !title) {
      return res.status(404).json({ error: 'Title not found' });
    }

    // Step 2: Get the latest snapshot for this title
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('word_count, sentence_count, avg_sentence_length, lexical_density, checksum')
      .eq('title_id', title.id)
      .order('retrieved_at', { ascending: false })
      .limit(1)
      .single();

    if (snapshotError || !snapshot) {
      return res.status(404).json({ error: 'No snapshot found' });
    }

    res.status(200).json(snapshot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve title metrics' });
  }
}
