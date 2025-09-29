import { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Link from 'next/link';

export default function Agencies() {
  const [metrics, setMetrics] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'total_words', direction: 'desc' });
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    fetch('/api/agencies/metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(err => console.error('Failed to load metrics:', err));
  }, []);

  const sortedMetrics = useMemo(() => {
    let sortableData = [...metrics];
    if (filterText) {
      sortableData = sortableData.filter(a =>
        a.agency_name.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0;
        const bVal = b[sortConfig.key] ?? 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [metrics, sortConfig, filterText]);

  const requestSort = key => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = key => {
    if (sortConfig.key !== key) return <FaSort className="inline ml-1" />;
    return sortConfig.direction === 'asc' ? <FaSortUp className="inline ml-1" /> : <FaSortDown className="inline ml-1" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">
        Code of Federal Regulations Explorer
      </h1>
      <h1 className="text-2xl font-bold mb-6 text-center">Agency Metrics</h1>
      <div className="mb-6 text-center">
        <Link
          href="/titles"
          className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg shadow hover:bg-gray-500 transition"
        >
          View All Titles
        </Link>
      </div>

      <div className="mb-4 flex justify-center">
        <input
          type="text"
          placeholder="Filter by agency name..."
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded shadow w-full max-w-sm text-center"
        />
      </div>

      {sortedMetrics.length === 0 ? (
        <p className="text-gray-700">Loading metrics...</p>
      ) : (
        <>
          <div className="overflow-x-auto mb-6">
            <div className="mb-4 text-gray-200 text-base">
              Click on an agency name below to view all titles for that agency.
            </div>
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th
                    className="px-4 py-2 text-left cursor-pointer"
                    onClick={() => requestSort('agency_name')}
                  >
                    Agency {getSortIcon('agency_name')}
                  </th>
                  <th
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => requestSort('total_words')}
                  >
                    Total Words {getSortIcon('total_words')}
                  </th>
                  <th
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => requestSort('total_sentences')}
                  >
                    Total Sentences {getSortIcon('total_sentences')}
                  </th>
                  <th
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => requestSort('avg_sentence_length')}
                  >
                    Avg Sentence Length {getSortIcon('avg_sentence_length')}
                  </th>
                  <th
                    className="px-4 py-2 text-right cursor-pointer"
                    onClick={() => requestSort('avg_lexical_density')}
                  >
                    Avg Lexical Density {getSortIcon('avg_lexical_density')}
                  </th>
                  <th className="px-4 py-2 text-right">Checksum</th>
                </tr>
              </thead>
              <tbody>
                {sortedMetrics.map(a => (
                  <tr key={a.agency_id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-4 py-2 font-semibold text-gray-900"><Link href={`/agencies/${a.agency_id}`} className="text-gray-600 hover:underline">
                      {a.agency_name}
                    </Link></td>
                    <td className="px-4 py-2 text-right text-gray-900">{a.total_words?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{a.total_sentences?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{(a.avg_sentence_length || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{(a.avg_lexical_density || 0).toFixed(2)}</td>
                    <td
                      className="px-4 py-2 text-right font-mono text-sm text-gray-700 cursor-pointer"
                      title="Click to copy"
                      onClick={() => {
                        navigator.clipboard.writeText(a.checksum || '');
                        alert('Checksum copied!');
                      }}
                    >
                      {a.checksum ? `${a.checksum.slice(0, 10)}…` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold mb-4">Word Count per Agency</h2>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedMetrics}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="agency_name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
                    return value;
                  }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', borderRadius: '0.375rem', color: '#111827' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value) => {
                    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
                    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
                    return value;
                  }}
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
