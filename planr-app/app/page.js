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
      .insert([
        {
          restaurants: selectedPlaces,
          location: city,
          votes: {},
          is_closed: false
        }
      ])
      .select();

    if (error) {
      alert("Error: " + error.message);
    } else {
      router.push(`/poll/${data[0].id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 font-sans">
      <h1 className="text-6xl font-black italic text-indigo-600 mb-2 tracking-tighter">PLANR.</h1>
      <p className="text-gray-500 font-bold mb-8 uppercase text-xs tracking-widest">Pick the spot. Invite the squad.</p>

      <div className="flex gap-2 mb-10">
        <input
          type="text"
          placeholder="Where are we eating? (e.g. Oslo)"
          className="flex-1 p-4 border-2 border-black rounded-2xl font-bold focus:ring-2 focus:ring-indigo-400 outline-none"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={searchYelp}
          className="bg-black text-white px-8 rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-32">
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div
              key={place.id}
              onClick={() => togglePlace(place)}
              className={`p-4 rounded-3xl cursor-pointer border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-lg' : 'border-gray-100 bg-white hover:border-black'}`}
            >
              <img src={place.image_url} className="w-full h-40 object-cover rounded-2xl mb-4" alt="" />
              <h3 className="font-bold text-lg leading-tight">{place.name}</h3>
              <p className="text-sm text-gray-500">{place.rating} ⭐ ({place.review_count} reviews)</p>
            </div>
          );
        })}
      </div>

      {selectedPlaces.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border-2 border-black p-4 rounded-full shadow-2xl flex items-center gap-6 min-w-[320px] justify-between animate-in slide-in-from-bottom-10">
          <span className="font-black text-sm ml-4">{selectedPlaces.length}/5 Selected</span>
          <button
            onClick={handleCreatePoll}
            className="bg-indigo-600 text-white px-8 py-3 rounded-full font-black uppercase text-sm hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Create Poll
          </button>
        </div>
      )}
    </div>
  );
}