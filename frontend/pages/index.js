import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Agencies() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    fetch('/api/agencies/metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(err => console.error('Failed to load metrics:', err));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Agency Metrics</h1>

      {metrics.length === 0 ? (
        <p className="text-gray-700">Loading metrics...</p>
      ) : (
        <div className="overflow-x-auto mb-6">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-gray-800">Agency</th>
                <th className="px-4 py-2 text-right text-gray-800">Total Words</th>
                <th className="px-4 py-2 text-right text-gray-800">Total Sentences</th>
                <th className="px-4 py-2 text-right text-gray-800">Avg Sentence Length</th>
                <th className="px-4 py-2 text-right text-gray-800">Avg Lexical Density</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(a => (
                <tr key={a.agency_id} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-2 font-semibold text-gray-900">
                    <Link href={`/agencies/${a.agency_id}`} className="text-blue-600 hover:underline">
                      {a.agency_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">{a.total_words?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{a.total_sentences?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{(a.avg_sentence_length || 0).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-gray-900">{(a.avg_lexical_density || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
