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
      console.log("Full Data Received:", data);

      // SAFETY NET: This handles data if it's {businesses: []} OR if it's just []
      const finalArray = data.businesses || (Array.isArray(data) ? data : []);

      setResults(finalArray);

      if (finalArray.length === 0) {
        console.warn("Search returned 0 results.");
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-5xl font-black mb-8 italic text-indigo-600">PLANR.</h1>

      <div className="flex gap-4 mb-12">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a city..."
          className="flex-1 p-4 border-4 border-black rounded-2xl text-xl font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <button
          onClick={handleSearch}
          className="bg-black text-white px-10 rounded-2xl font-black text-xl hover:bg-indigo-600 transition-all"
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {/* THE GRID: This is where the magic happens */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {results.map((biz) => (
          <div key={biz.id} className="border-4 border-black p-4 rounded-3xl bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all cursor-pointer">
            <img
              src={biz.image_url || 'https://via.placeholder.com/400'}
              className="h-48 w-full object-cover rounded-2xl mb-4 border-2 border-black"
              alt={biz.name}
            />
            <h3 className="font-bold text-2xl truncate">{biz.name}</h3>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-indigo-600">{biz.rating} ⭐</span>
              <span className="font-bold text-gray-400">{biz.price || '$$'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* EMPTY STATE HELPER */}
      {!loading && results.length === 0 && query && (
        <p className="text-center text-gray-400 font-bold mt-20">No restaurants found. Try a different city!</p>
      )}