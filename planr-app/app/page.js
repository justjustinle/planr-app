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
    } catch (err) { console.error(err); }
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
    const { data, error } = await supabase.from('polls').insert([{
      restaurants: selectedPlaces,
      location: city,
      votes: {},
      is_closed: false
    }]).select();
    if (!error) router.push(`/poll/${data[0].id}`);
  };

  return (
    <div style={{ backgroundColor: '#FFFDF9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#2D2926', paddingBottom: '120px' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', padding: '60px 20px 40px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', color: '#6366f1', letterSpacing: '-2px', margin: 0 }}>PLANR.</h1>
        <p style={{ color: '#A0A0A0', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '10px' }}>The Squad Decider</p>
      </header>

      {/* Search Bar */}
      <div style={{ maxWidth: '500px', margin: '0 auto 50px', padding: '0 20px', display: 'flex', gap: '10px' }}>
        <input
          style={{ flex: 1, padding: '20px 25px', borderRadius: '40px', border: '2px solid #EEE', fontSize: '16px', fontWeight: 'bold', outline: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}
          placeholder="Where are we eating?"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          onClick={searchYelp}
          style={{ backgroundColor: '#000', color: '#FFF', padding: '0 30px', borderRadius: '40px', border: 'none', fontWeight: '900', cursor: 'pointer', transition: '0.2s' }}
        >
          {loading ? '...' : 'GO'}
        </button>
      </div>

      {/* Results */}
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div
              key={place.id}
              onClick={() => togglePlace(place)}
              style={{ position: 'relative', height: '350px', borderRadius: '35px', overflow: 'hidden', cursor: 'pointer', border: isSelected ? '5px solid #6366f1' : 'none', transition: '0.3s', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            >
              <img src={place.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '30px', left: '30px', right: '30px', color: '#FFF' }}>
                <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '5px', opacity: 0.8 }}>{place.location.city}</p>
                <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{place.name}</h3>
                <p style={{ fontSize: '14px', marginTop: '5px' }}>{place.rating} ★ • {place.price || '$$'}</p>
              </div>
              <div style={{ position: 'absolute', top: '25px', right: '25px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#FFF', fontWeight: 'bold', fontSize: '20px', display: 'flex', justifyContent: 'center' }}>
                {isSelected ? '✓' : '+'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar */}
      {selectedPlaces.length > 0 && (
        <div style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', backgroundColor: '#000', padding: '20px 30px', borderRadius: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', zIndex: 100 }}>
          <div style={{ color: '#FFF' }}>
            <p style={{ margin: 0, fontSize: '22px', fontWeight: '900' }}>{selectedPlaces.length}</p>
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Selected</p>
          </div>
          <button
            onClick={handleCreatePoll}
            style={{ backgroundColor: '#6366f1', color: '#FFF', border: 'none', padding: '15px 35px', borderRadius: '30px', fontWeight: '900', textTransform: 'uppercase', fontSize: '12px', cursor: 'pointer' }}
          >
            Create Poll
          </button>
        </div>
      )}
    </div>
  );
}