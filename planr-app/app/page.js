"use client";
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Home() {
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const searchYelp = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/search?location=${city}`);
      const data = await response.json();
      setResults(data.businesses || []);
    } catch (err) {
      console.error("Search failed", err);
    }
    setLoading(false);
  };

  const togglePlace = (place) => {
    setSelectedPlaces((prev) => {
      const isAlreadySelected = prev.find((p) => p.id === place.id);
      if (isAlreadySelected) return prev.filter((p) => p.id !== place.id);
      if (prev.length < 5) return [...prev, place];
      return prev;
    });
  };

  const handleCreatePoll = async () => {
    const { data, error } = await supabase
      .from('polls')
      .insert([{
        restaurants: selectedPlaces,
        location: city,
        votes: {},
        is_closed: false
      }])
      .select();

    if (!error) router.push(`/poll/${data[0].id}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-black italic text-indigo-600 tracking-tighter">PLANR.</h1>
        <div className="mt-2 inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Search & Invite
        </div>
      </header>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Enter City (e.g. Oslo)"
          className="flex-1 p-4 border-2 border-black rounded-2xl font-bold text-sm shadow-sm outline-none focus:border-indigo-500 transition-colors"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={searchYelp}
          className="bg-black text-white px-6 rounded-2xl font-bold hover:bg-gray-800 active:scale-95 transition-all"
        >
          {loading ? '...' : 'Go'}
        </button>
      </div>

      <div className="space-y-4 pb-32">
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div
              key={place.id}
              onClick={() => togglePlace(place)}
              className={`border-2 transition-all duration-300 p-4 rounded-2xl flex justify-between items-center bg-white shadow-sm cursor-pointer ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-black'
              }`}
            >
              <div className="flex items-center gap-4">
                <img src={place.image_url} className="w-14 h-14 object-cover rounded-xl shadow-inner" alt="" />
                <div className="max-w-[150px]">
                  <h3 className="font-bold text-md leading-tight truncate">{place.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{place.rating} ⭐ • {place.price || '$$'}</p>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 text-transparent'
              }`}>
                ✓
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlaces.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border-2 border-black p-4 rounded-3xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5">
          <div className="pl-2">
            <p className="font-black text-indigo-600 text-lg leading-none">{selectedPlaces.length}/5</p>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">Selected</p>
          </div>
          <button
            onClick={handleCreatePoll}
            className="bg-black text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 active:scale-90 transition-all"
          >
            Create Group Poll
          </button>
        </div>
      )}
    </div>
  );
}