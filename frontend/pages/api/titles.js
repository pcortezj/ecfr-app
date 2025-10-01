// pages/api/titles.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data: titles, error } = await supabase
      .from('titles')
      .select('*')
      .order('number', { ascending: true });

    if (error) throw error;

    res.status(200).json(titles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch titles' });
  }
}
