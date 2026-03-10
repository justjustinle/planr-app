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
    console.log("Clicked:", place.name); // Check your browser console!
    setSelectedPlaces((prev) => {
      const isAlreadySelected = prev.find((p) => p.id === place.id);
      if (isAlreadySelected) {
        return prev.filter((p) => p.id !== place.id);
      }
      if (prev.length < 5) {
        return [...prev, place];
      }
      return prev;
    });
  };

  const handleCreatePoll = async () => {
    if (selectedPlaces.length === 0) return;

    const { data, error } = await supabase
      .from('polls')
      .insert([{
        restaurants: selectedPlaces,
        location: city,
        votes: {},
        is_closed: false
      }])
      .select();

    if (error) {
      alert("Supabase Error: " + error.message);
    } else {
      router.push(`/poll/${data[0].id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen bg-white">
      <header className="py-10">
        <h1 className="text-6xl font-black italic text-indigo-600 tracking-tighter">PLANR.</h1>
        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs mt-2">The Group Dinner Decider</p>
      </header>

      <div className="flex gap-3 mb-12">
        <input
          type="text"
          placeholder="Enter city..."
          className="flex-1 p-4 border-2 border-black rounded-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={searchYelp}
          className="bg-black text-white px-8 rounded-2xl font-black hover:bg-indigo-600 transition-all active:scale-95"
        >
          {loading ? '...' : 'SEARCH'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-40">
        {results.map((place) => {
          const isSelected = selectedPlaces.some((p) => p.id === place.id);
          return (
            <div
              key={place.id}
              onClick={() => togglePlace(place)}
              className={`relative cursor-pointer p-4 rounded-[2rem] border-4 transition-all duration-200 select-none ${
                isSelected ? 'border-indigo-600 bg-indigo-50 shadow-xl scale-[1.02]' : 'border-gray-100 hover:border-black bg-white'
              }`}
            >
              <img src={place.image_url} className="w-full h-48 object-cover rounded-[1.5rem] mb-4 pointer-events-none" alt="" />
              <div className="px-2">
                <h3 className="font-black text-xl leading-tight mb-1">{place.name}</h3>
                <p className="text-gray-500 font-bold text-sm">{place.rating} ⭐ • {place.review_count} reviews</p>
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  ✓
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedPlaces.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border-4 border-black p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between z-50">
          <div>
            <p className="font-black text-2xl leading-none">{selectedPlaces.length}</p>
            <p className="text-[10px] uppercase font-bold text-gray-400">Selected</p>
          </div>
          <button
            onClick={handleCreatePoll}
            className="bg-indigo-600 text-white px-10 py-4 rounded-full font-black uppercase text-sm tracking-widest hover:bg-black transition-all active:scale-90"
          >
            Create Poll
          </button>
        </div>
      )}
    </div>
  );
}