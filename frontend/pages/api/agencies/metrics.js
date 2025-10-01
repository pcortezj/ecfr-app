import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Step 1: Fetch parent agency metrics
    const { data: parents, error: metricsError } = await supabase.rpc('get_agency_metrics');
    if (metricsError) throw metricsError;
    if (!parents || parents.length === 0) return res.status(200).json([]);

    const parentIds = parents.map(p => p.agency_id);

    // Step 2: Fetch all children of these parents in a single query
    const { data: children, error: childrenError } = await supabase
      .from('agencies')
      .select('id, parent_id')
      .in('parent_id', parentIds);
    if (childrenError) throw childrenError;

    // Map parent ID → children IDs
    const parentToChildren = {};
    children.forEach(c => {
      if (!parentToChildren[c.parent_id]) parentToChildren[c.parent_id] = [];
      parentToChildren[c.parent_id].push(c.id);
    });

    // Step 3: Fetch all titles for parents + children in a single query
    const allAgencyIds = parentIds.concat(children.map(c => c.id));
    const { data: titles, error: titlesError } = await supabase
      .from('titles')
      .select('id, number, name, title_agency!inner(agency_id)')
      .in('title_agency.agency_id', allAgencyIds);
    if (titlesError) throw titlesError;

    // Step 4: Attach titles to each parent (including children titles)
    const agenciesWithTitles = parents.map(parent => {
      const ids = [parent.agency_id, ...(parentToChildren[parent.agency_id] || [])];

      const titlesForParent = titles
        .filter(t => t.title_agency.some(ta => ids.includes(ta.agency_id)))
        .map(t => ({ id: t.id, number: t.number, name: t.name }));

      return {
        ...parent,
        titles: titlesForParent,
      };
    });

    res.status(200).json(agenciesWithTitles);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Failed to retrieve agency metrics' });
  }
}
