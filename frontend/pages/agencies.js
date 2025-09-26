import { useEffect, useState } from 'react';
import { getAgencies } from '../lib/api';

export default function Agencies() {
  const [agencies, setAgencies] = useState([]);

  useEffect(() => {
    getAgencies().then(setAgencies);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Agencies</h1>
      <ul>
        {agencies.map(a => (
          <li key={a.id}>
            {a.name} ({a.short_name})
          </li>
        ))}
      </ul>
    </div>
  );
}
