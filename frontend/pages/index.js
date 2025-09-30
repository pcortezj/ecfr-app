import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

// Utility to format large numbers
const formatNumber = (num) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
};

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);
  const [sortKey, setSortKey] = useState('agency_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch('/api/agencies/metrics')
      .then(res => res.json())
      .then(setAgencies)
      .catch(err => console.error('Failed to load metrics:', err));
  }, []);

  const sortedFiltered = agencies
    .filter(a => a.agency_name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">
        Code of Federal Regulations Explorer
      </h1>
      <h1 className="text-3xl font-bold mb-6 text-center">Agency Metrics</h1>
      <div className="mb-6 text-center">

      <Link
          href="/titles"
          className="mb-6 inline-block bg-gray-800 text-white text-center px-4 py-2 rounded-lg shadow hover:bg-gray-500 transition"
        >
          View All Titles
        </Link>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter agencies..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full max-w-sm"
        />
      </div>
      </div>

      {agencies.length === 0 ? (
        <p className="text-gray-300">Loading metrics...</p>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => toggleSort('agency_name')}
                  >
                    Agency {sortKey === 'agency_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => toggleSort('total_words')}
                  >
                    Total Words {sortKey === 'total_words' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-right" onClick={() => toggleSort('total_sentences')}>
                    Total Sentences {sortKey === 'total_sentences' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-right" onClick={() => toggleSort('avg_sentence_length')}>
                    Avg Sentence Length {sortKey === 'avg_sentence_length' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-right" onClick={() => toggleSort('avg_lexical_density')}>
                    Avg Lexical Density {sortKey === 'avg_lexical_density' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-right">Titles</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map(a => (
                  <tr key={a.agency_id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-4 py-2 font-semibold text-gray-900">
                      <Link href={`/agencies/${a.agency_id}`} className="text-blue-600 hover:underline">
                        {a.agency_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">{formatNumber(a.total_words)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{formatNumber(a.total_sentences)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{(a.avg_sentence_length || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{(a.avg_lexical_density || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {a.titles.map(t => (
                        <div key={t.id}>
                          <Link href={`/titles/${t.number}`} className="text-blue-600 hover:underline">
                            {t.name}
                          </Link>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Word Count Chart */}
          <h2 className="text-2xl font-semibold mb-4">Word Count per Agency</h2>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedFiltered}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="agency_name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', color: '#111827' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={value => formatNumber(value)}
                />
                <Line type="monotone" dataKey="total_words" stroke="#4f46e5" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
