import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

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
  const [expandedParents, setExpandedParents] = useState({});

  useEffect(() => {
    async function fetchAgencies() {
      const res = await fetch('/api/agencies/metrics');
      const data = await res.json();

      if (Array.isArray(data)) {
        // Fold children under their parents
        const parents = data.filter(a => !a.parent_id).map(parent => ({
          ...parent,
          children: data.filter(c => c.parent_id === parent.agency_id),
        }));
        setAgencies(parents);
      } else console.error('Invalid API response:', data);
    }
    fetchAgencies();
  }, []);

  const compareByKey = (a, b, key) => {
    const A = a?.[key];
    const B = b?.[key];
    if (A == null && B == null) return 0;
    if (A == null) return -1;
    if (B == null) return 1;

    const numA = Number(A);
    const numB = Number(B);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;

    return A.toString().toLowerCase().localeCompare(B.toString().toLowerCase());
  };

  const sortedFiltered = agencies
    .filter(a => {
      const query = filter.toLowerCase();
      const inParent = a.agency_name.toLowerCase().includes(query);
      const inTitles = a.titles?.some(t => t.name.toLowerCase().includes(query) || t.number.toString().includes(query));
      const inChildren = a.children?.some(child =>
        child.agency_name.toLowerCase().includes(query) ||
        child.titles?.some(t => t.name.toLowerCase().includes(query) || t.number.toString().includes(query))
      );
      return inParent || inTitles || inChildren;
    })
    .sort((a, b) => compareByKey(a, b, sortKey) * (sortOrder === 'asc' ? 1 : -1));

  const toggleSort = (key) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleParent = (parentId) => {
    setExpandedParents(prev => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">
        Code of Federal Regulations Explorer
      </h1>
      <h2 className="text-3xl font-bold mb-6 text-center">Agency Metrics</h2>

      <div className="mb-6 text-center">
        <Link
          href="/titles"
          className="mb-6 inline-block bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
        >
          View All Titles
        </Link>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Filter by agency or title..."
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
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
              <thead className="bg-gray-200 text-gray-800">
                <tr>
                  <th onClick={() => toggleSort('agency_name')} className="px-4 py-2 text-left cursor-pointer">
                    Agency {sortKey === 'agency_name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => toggleSort('total_words')} className="px-4 py-2 text-right cursor-pointer">
                    Total Words {sortKey === 'total_words' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => toggleSort('total_sentences')} className="px-4 py-2 text-right cursor-pointer">
                    Total Sentences {sortKey === 'total_sentences' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => toggleSort('avg_sentence_length')} className="px-4 py-2 text-right cursor-pointer">
                    Avg Sentence Length {sortKey === 'avg_sentence_length' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => toggleSort('avg_lexical_density')} className="px-4 py-2 text-right cursor-pointer">
                    Avg Lexical Density {sortKey === 'avg_lexical_density' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th className="px-4 py-2 text-right">Titles</th>
                </tr>
              </thead>
              <tbody>
                {sortedFiltered.map(parent => (
                  <Fragment key={parent.agency_id}>
                    {/* Parent row */}
                    <tr
                      className="hover:bg-gray-50 border-b border-gray-200 cursor-pointer bg-gray-100"
                      onClick={() => toggleParent(parent.agency_id)}
                    >
                      <td className="px-4 py-2 font-semibold text-gray-900">
                        <div className="flex items-center">
                          {parent.children?.length > 0 && (
                            <button

                              className="mr-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                            >
                              {expandedParents[parent.agency_id] ? "▼" : "▶"}
                            </button>
                          )}
                          <Link
                            href={`/agencies/${parent.agency_id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {parent.agency_name}
                          </Link>
                        </div>
                      </td>

                      <td className="px-4 py-2 text-right text-gray-900">{formatNumber(parent.total_words)}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{formatNumber(parent.total_sentences)}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{(parent.avg_sentence_length || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-gray-900">{(parent.avg_lexical_density || 0).toFixed(2)}</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {parent.titles.map(t => (
                          <div key={t.id}>
                            <Link href={`/titles/${t.number}`} className="text-blue-600 hover:underline">{t.name}</Link>
                          </div>
                        ))}
                      </td>
                    </tr>

                    {/* Children rows */}
                    {expandedParents[parent.agency_id] && parent.children?.map(child => (
                      <tr key={child.agency_id} className="bg-gray-50 border-b border-gray-200">
                        <td className="px-4 py-2 text-gray-700">
                          <div className="flex items-center pl-8">
                            {/* empty placeholder so alignment matches */}
                            <span className="inline-block w-4" />
                            <Link
                              href={`/agencies/${child.agency_id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {child.agency_name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-800">{formatNumber(child.total_words)}</td>
                        <td className="px-4 py-2 text-right text-gray-800">{formatNumber(child.total_sentences)}</td>
                        <td className="px-4 py-2 text-right text-gray-800">{(child.avg_sentence_length || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-gray-800">{(child.avg_lexical_density || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-gray-800">
                          {child.titles.map(t => (
                            <div key={t.id}>
                              <Link href={`/titles/${t.number}`} className="text-blue-600 hover:underline">{t.name}</Link>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold mb-4">Word Count per Agency</h2>
          <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sortedFiltered}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="agency_name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={formatNumber} />
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
