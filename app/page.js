"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // THE MISSING FUNCTION
  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        body: JSON.stringify({ location: query }),
      });
      const data = await res.json();
      setResults(data.businesses || []);
    } catch (err) {
      console.error("Search failed", err);
    }
    setLoading(false);
  };

  const toggleSelect = (biz) => {
    if (selected.find(s => s.id === biz.id)) {
      setSelected(selected.filter(s => s.id !== biz.id));
    } else if (selected.length < 5) {
      setSelected([...selected, biz]);
    }
  };

  const createPoll = async () => {
    const res = await fetch('/api/create-poll', {
      method: 'POST',
      body: JSON.stringify({ options: selected }),
    });
    const { id } = await res.json();
    router.push(`/poll/${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <h1 className="text-6xl font-black italic text-indigo-600 mb-8">PLANR.</h1>

      <div className="flex gap-2 mb-10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Where are we going? (e.g. NYC, Miami)"
          className="flex-1 border-4 border-black p-4 rounded-2xl text-xl font-bold focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <button
          onClick={handleSearch}
          className="bg-black text-white px-8 rounded-2xl font-black hover:bg-indigo-600 transition-colors"
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((biz) => (
          <div
            key={biz.id}
            onClick={() => toggleSelect(biz)}
            className={`cursor-pointer border-4 border-black p-4 rounded-3xl transition-all ${selected.find(s => s.id === biz.id) ? 'bg-indigo-100 translate-y-1 shadow-none' : 'bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'}`}
          >
            <img src={biz.image_url} className="h-40 w-full object-cover rounded-xl mb-4" />
            <h3 className="font-bold text-xl">{biz.name}</h3>
            <p className="text-gray-500 font-medium">{biz.rating} Stars • {biz.price || '$$'}</p>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white border-4 border-black p-6 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex items-center gap-8 w-[90%] max-w-2xl">
          <div className="flex-1">
            <p className="font-black text-2xl">{selected.length}/5 SELECTED</p>
          </div>
          <button
            onClick={createPoll}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xl hover:bg-black transition-colors"
          >
            START LIVE POLL
          </button>
        </div>
      )}
    </div>
  );
}