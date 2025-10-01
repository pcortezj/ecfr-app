// pages/api/agencies/[id]/titles.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing agency ID' });

  try {
    // Step 1: Get titles for the agency via the join table
    const { data: titles, error } = await supabase
      .from('titles')
      .select(`
        id,
        number,
        name,
        latest_amended_on,
        latest_issue_date,
        up_to_date_as_of,
        reserved,
        title_agency!inner(agency_id)
      `)
      .eq('title_agency.agency_id', id)
      .order('number', { ascending: true });

    if (error) throw error;

    // Step 2: Map titles to remove the join info, keep original fields
    const result = titles.map(t => ({
      id: t.id,
      number: t.number,
      name: t.name,
      latest_amended_on: t.latest_amended_on,
      latest_issue_date: t.latest_issue_date,
      up_to_date_as_of: t.up_to_date_as_of,
      reserved: t.reserved,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching titles for agency', id, err);
    res.status(500).json({ error: 'Failed to fetch titles' });
  }
}
