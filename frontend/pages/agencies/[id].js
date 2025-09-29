import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AgencyTitles() {
    const router = useRouter();
    const { id } = router.query;
    const [titles, setTitles] = useState([]);

    useEffect(() => {
        if (!id) return;
        fetch(`/api/agencies/${id}/titles`)
            .then((res) => res.json())
            .then(setTitles)
            .catch((err) => console.error('Failed to load titles:', err));
    }, [id]);

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Agency Titles</h1>

            {titles.length === 0 ? (
                <p className="text-white">Loading titles...</p>
            ) : (
                <div className="overflow-x-auto">
                    <div className="mb-4 text-gray-200 text-base">
                        Click on a title name below to view title metrics.
                    </div>
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg shadow-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Number</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Latest Amended</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Latest Issue</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Up-to-date</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Reserved</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {titles.map((t, idx) => (
                                <tr
                                    key={t.id}
                                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}
                                >
                                    <td className="px-4 py-2 text-black">{t.number}</td>
                                    <td className="px-4 py-2">
                                        <Link
                                            href={`/titles/${t.number}`}
                                            className="text-gray-700 hover:underline"
                                        >
                                            {t.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2 text-black">{t.latest_amended_on}</td>
                                    <td className="px-4 py-2 text-black">{t.latest_issue_date}</td>
                                    <td className="px-4 py-2 text-black">{t.up_to_date_as_of}</td>
                                    <td className="px-4 py-2 text-black">{t.reserved ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-6">
                <Link href="/" className="text-gray-300 hover:underline">
                    &larr; Back to Agencies
                </Link>
            </div>
        </div>
    );
}
