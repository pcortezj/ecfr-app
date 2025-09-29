import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getTitles, getTitleMetrics, getTitleHistory, getRawText } from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function TitleDetail() {
    const router = useRouter();
    const { number } = router.query;

    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState([]);
    const [rawText, setRawText] = useState('');
    const [titleInfo, setTitleInfo] = useState(null);

    useEffect(() => {
        if (!number) return;

        // Fetch metrics & history
        getTitleMetrics(number).then(setMetrics);
        getTitleHistory(number).then(setHistory);
        getRawText(number).then(setRawText);

        // Fetch title info
        getTitles().then(titles => {
            const t = titles.find(title => title.number === Number(number));
            setTitleInfo(t);
        });
    }, [number]);

    if (!metrics || !titleInfo) return <p className="text-center mt-20 text-gray-500">Loading...</p>;

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-md mt-6">
            {/* Back link */}
            <p className="mb-4 text-blue-600 hover:underline">
                <Link href="/">← Back to Home</Link>
            </p>

            <h1 className="text-3xl font-bold mb-3 text-gray-800">
                Title {number}: {titleInfo.name}
            </h1>

            <div className="grid grid-cols-2 gap-4 mb-6 text-gray-700">
                <p><strong>Latest Amended:</strong> {titleInfo.latest_amended_on}</p>
                <p><strong>Latest Issue:</strong> {titleInfo.latest_issue_date}</p>
                <p><strong>Up-to-date:</strong> {titleInfo.up_to_date_as_of}</p>
                <p><strong>Reserved:</strong> {titleInfo.reserved ? 'Yes' : 'No'}</p>
            </div>

            <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800">Metrics</h2>
            <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
                <p>Word count: {metrics.word_count}</p>
                <p>Sentence count: {metrics.sentence_count}</p>
                <p>Average sentence length: {metrics.avg_sentence_length.toFixed(2)}</p>
                <p>Lexical density: {metrics.lexical_density.toFixed(2)}</p>
                <p>Checksum: {metrics.checksum.slice(0, 10)}…</p>
            </div>

            <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-800">Historical Word Count</h2>
            <div className="w-full h-80 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                        <XAxis dataKey="retrieved_at" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: 'white', borderColor: '#ccc' }}
                            labelStyle={{ color: 'black' }}
                            itemStyle={{ color: 'black' }} />
                        <Line type="monotone" dataKey="word_count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <h2 className="text-2xl font-semibold mt-6 mb-3 text-black">Raw Text (Preview)</h2>
            <a
                href={`/api/snapshots/${[number]}/download`}
                className="inline-block bg-gray-800 text-white px-3 py-1 rounded-lg shadow hover:bg-gray-400 transition mb-2"
            >
                Download Full Text
            </a>

            <textarea
                className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none text-gray-800"
                value={rawText.slice(0, 5000)}
                readOnly
            />


            {/* Back link at bottom for convenience */}
            <p className="mt-6 text-blue-600 hover:underline">
                <Link href="/">← Back to Home</Link>
            </p>
        </div>
    );
}
