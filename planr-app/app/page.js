"use client";
import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    setResults([]); // Clear results so we know the new search is happening

    try {
      console.log("Searching for:", query);
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: query }),
      });

      const rawData = await res.json();
      console.log("RAW API RESPONSE:", rawData);

      // --- THE UNIVERSAL DATA CATCHER ---
      // This checks every possible format the API might be sending
      let finalArray = [];
      if (Array.isArray(rawData)) {
        finalArray = rawData; // Naked array: [{}, {}]
      } else if (rawData.businesses && Array.isArray(rawData.businesses)) {
        finalArray = rawData.businesses; // Wrapped array: { businesses: [{}, {}] }
      } else if (rawData.data && Array.isArray(rawData.data)) {
        finalArray = rawData.data; // Alternate wrap: { data: [{}, {}] }
      }

      if (finalArray.length === 0) {
        setError("Yelp found no results. Try a bigger city (e.g., 'New York')");
      }

      setResults(finalArray);
    } catch (err) {
      console.error("SEARCH CRASHED:", err);
      setError("Something went wrong. Check your Vercel logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 font-sans">
      <header className="mb-12">
        <h1 className="text-7xl font-black italic text-indigo-600 tracking-tighter mb-2">PLANR.</h1>
        <p className="text-gray-400 font-bold uppercase tracking-widest">Find. Vote. Eat.</p>
      </header>

      {/* SEARCH BAR */}
      <div className="flex gap-4 mb-16">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Where are we eating? (e.g. London, NYC)"
          className="flex-1 p-6 border-4 border-black rounded-3xl text-2xl font-bold focus:outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-x-1 focus:translate-y-1 focus:shadow-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-black text-white px-12 rounded-3xl font-black text-2xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-100 border-4 border-red-500 p-4 rounded-2xl mb-8 font-bold text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* RESULTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {results.map((biz) => (
          <div
            key={biz.id}
            className="group border-4 border-black p-5 rounded-[40px] bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 hover:shadow-none transition-all cursor-pointer"
          >
            <div className="relative h-56 w-full mb-6 overflow-hidden rounded-[30px] border-2 border-black">
              <img
                src={biz.image_url || 'https://via.placeholder.com/400'}
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                alt={biz.name}
              />
            </div>
            <h3 className="font-black text-3xl mb