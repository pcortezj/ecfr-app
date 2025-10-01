import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getTitles } from '../lib/api';

export default function TitlesPage() {
  const [titles, setTitles] = useState([]);
  const [sortKey, setSortKey] = useState('number');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return; // wait until router.query.id is populated
    setLoading(true);

    getTitles(id)
      .then(data => setTitles(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const sortedFiltered = titles
    .filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (!id) {
    // router query not ready yet
    return <p className="p-6 text-gray-700">Loading agency...</p>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mt-6 mb-6">
        <Link href="/" className="text-gray-300 hover:underline">&larr; Back to Home</Link>
      </div>
      <h1 className="text-3xl font-bold mb-4">{`Agency ${id} Titles`}</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter titles..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-gray-700">Loading titles...</p>
      ) : titles.length === 0 ? (
        <p className="text-gray-700">No titles found for this agency.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gray-200 text-gray-800">
              <tr>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort('number')}>
                  Number {sortKey === 'number' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 text-left cursor-pointer" onClick={() => toggleSort('name')}>
                  Name {sortKey === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th className="px-4 py-2 text-left">Latest Amended</th>
                <th className="px-4 py-2 text-left">Latest Issue</th>
                <th className="px-4 py-2 text-left">Up-to-date</th>
                <th className="px-4 py-2 text-left">Reserved</th>
                <th className="px-4 py-2 text-left">Snapshot</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedFiltered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{t.number}</td>
                  <td className="px-4 py-2 text-gray-900">
                    <Link href={`/titles/${t.number}`} className="text-blue-600 hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-800">{t.latest_amended_on}</td>
                  <td className="px-4 py-2 text-gray-800">{t.latest_issue_date}</td>
                  <td className="px-4 py-2 text-gray-800">{t.up_to_date_as_of}</td>
                  <td className="px-4 py-2 text-gray-800">{t.reserved ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 text-gray-800">
                    <a
                      href={`/api/snapshots/${t.number}/download`}
                      className="inline-block bg-gray-800 text-white px-3 py-1 rounded-lg shadow hover:bg-gray-400 transition"
                    >
                      Download Full Text
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/" className="text-gray-300 hover:underline">&larr; Back to Home</Link>
      </div>
    </div>
  );
}
