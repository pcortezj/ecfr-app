// pages/api/titles/[number]/history.ts
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

    // Step 2: Get all snapshots for this title, ordered by retrieved_at ASC
    const { data: snapshots, error: snapshotsError } = await supabase
      .from('snapshots')
      .select('retrieved_at, word_count, sentence_count, avg_sentence_length, lexical_density')
      .eq('title_id', title.id)
      .order('retrieved_at', { ascending: true });

    if (snapshotsError) throw snapshotsError;

    res.status(200).json(snapshots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve snapshots history' });
  }
}
