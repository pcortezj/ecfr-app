// pages/api/agencies/[id].ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing agency ID' });

  try {
    // Step 1: Fetch agency details
    const { data: agency, error: agencyError } = await supabase
      .from('agencies')
      .select('id, name AS agency_name, short_name, slug')
      .eq('id', id)
      .single();

    if (agencyError || !agency) {
      return res.status(404).json({ error: 'Agency not found' });
    }

    // Step 2: Fetch titles linked to this agency via agency_id
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('id, number, name, latest_amended_on, latest_issue_date, up_to_date_as_of, reserved')
      .eq('agency_id', id)
      .order('number', { ascending: true });

    if (titlesError) throw titlesError;

    res.status(200).json({ agency, titles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
