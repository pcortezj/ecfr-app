// pages/api/snapshots/[id]/download.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // Step 1: Find the title by number
    const { data: title, error: titleError } = await supabase
      .from('titles')
      .select('*')
      .eq('number', id)
      .single();

    if (titleError || !title) {
      return res.status(404).json({ error: 'Title not found' });
    }

    // Step 2: Get the first snapshot for this title
    const { data: snapshot, error: snapshotError } = await supabase
      .from('snapshots')
      .select('raw_text')
      .eq('title_id', title.id)
      .limit(1)
      .single();

    if (snapshotError || !snapshot) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }

    // Step 3: Return as a downloadable text file
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="title-${id}.txt"`);
    res.status(200).send(snapshot.raw_text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download snapshot' });
  }
}
