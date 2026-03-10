"use client";
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: query }),
      });
      const data = await res.json();
      // Handle both {businesses: []} and naked []
      const finalArray = data.businesses || (Array.isArray(data) ? data : []);
      setResults(finalArray);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-10 font-sans">
      <h1 className="text-6xl font-black text-indigo-600 mb-10 italic">PLANR.</h1>

      <div className="flex gap-4 mb-12">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where to?"
          className="flex-1 p-5 border-4 border-black rounded-2xl text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <button
          onClick={handleSearch}
          className="bg-black text-white px-10 rounded-2xl font-black text-xl hover:bg-indigo-600"
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {results.map((biz) => (
          <div key={biz.id} className="border-4 border-black p-4 rounded-3xl bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <img src={biz.image_url} className="h-48 w-full object-cover rounded-2xl mb-4" alt="" />
            <h3 className="font-bold text-2xl">{biz.name}</h3>
            <p className="font-bold text-indigo-500">{biz.rating} Stars</p>
          </div>
        ))}
      </div>
    </div>
  );
}