"use client";
import { useState } from 'react';

export default function Home() {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. The Search Logic
  const search = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ location: 'London', term: e.target.term.value })
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  // 2. The Selection Logic
  const toggleSelect = (item) => {
    if (selected.find(s => s.id === item.id)) {
      setSelected(selected.filter(s => s.id !== item.id));
    } else if (selected.length < 5) {
      setSelected([...selected, item]);
    }
  };

  // 3. THE "VOILA" LOGIC (This talks to your new create-poll file)
  const createPoll = async () => {
    const response = await fetch('/api/create-poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ options: selected })
    });
    const data = await response.json();
    if (data.id) {
      // This sends you to the live voting page!
      window.location.href = `/poll/${data.id}`;
    } else {
      alert("Something went wrong saving the poll.");
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-5xl font-black italic text-indigo-600 mb-2">PLANR.</h1>
      <p className="text-gray-500 mb-8 font-medium">Last-minute London group plans.</p>

      <form onSubmit={search} className="flex gap-2 mb-10">
        <input name="term" placeholder="Dinner, Drinks, Soho..." className="flex-1 border-2 border-black p-4 rounded-xl font-bold text-black" />
        <button className="bg-black text-white px-8 rounded-xl font-bold uppercase">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="space-y-4 mb-32">
        {results.map(item => (
          <div key={item.id} onClick={() => toggleSelect(item)}
               className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${selected.find(s => s.id === item.id) ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-black'}`}>
            <h3 className="font-bold text-lg text-black">{item.name}</h3>
            <p className="text-sm text-gray-500">{item.location?.address1} • {item.rating} ⭐</p>
          </div>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white border-4 border-black p-6 rounded-3xl shadow-2xl w-full max-w-sm z-50">
          <p className="font-bold text-center mb-4 text-black">{selected.length}/5 Venues Picked</p>
          <button
            onClick={createPoll}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-indigo-700 transition-colors">
            Start Live Poll 🔥
          </button>
        </div>
      )}
    </main>
  );
}