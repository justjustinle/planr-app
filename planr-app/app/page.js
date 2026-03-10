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
  const [activity, setActivity] = useState('restaurants');
  const [groupSize, setGroupSize] = useState('4');
  const [results, setResults] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const searchVibe = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/search?location=${city}&term=${activity}`);
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
    if (selectedPlaces.length === 0) return alert("Pick some spots first!");

    const { data, error } = await supabase.from('polls').insert([{
      restaurants: selectedPlaces,
      location: city,
      votes: {},
      is_closed: false,
      group_size: groupSize,      // Matches Supabase column
      activity_type: activity     // Matches Supabase column
    }]).select();

    if (error) {
        console.error(error);
        alert("Database Error: " + error.message);
    } else {
        router.push(`/poll/${data[0].id}`);
    }
  };

  return (
    <div style={{ backgroundColor: '#FFFDF9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#2D2926', paddingBottom: '120px' }}>
      <header style={{ textAlign: 'center', padding: '50px 20px 30px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', fontStyle: 'italic', color: '#6366f1', letterSpacing: '-2px', margin: 0 }}>PLANR.</h1>
      </header>

      {/* SQUAD SETUP PANEL */}
      <div style={{ maxWidth: '500px', margin: '0 auto 30px', padding: '0 20px' }}>
        <div style={{ backgroundColor: '#FFF', borderRadius: '35px', padding: '25px', boxShadow: '0 15px 40px rgba(0,0,0,0.04)', border: '1px solid #F0F0F0' }}>

          <p style={{ fontSize: '10px', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', marginBottom: '15px' }}>1. The Vibe</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
            {['restaurants', 'cocktailbars', 'active'].map((v) => (
              <button
                key={v}
                onClick={() => setActivity(v)}
                style={{ flex: 1, padding: '12px', borderRadius: '15px', border: 'none', backgroundColor: activity === v ? '#6366f1' : '#F3F4F6', color: activity === v ? '#FFF' : '#666', fontWeight: 'bold', fontSize: '11px', textTransform: 'capitalize', cursor: 'pointer', transition: '0.2s' }}
              >
                {v === 'active' ? 'Activity' : v === 'cocktailbars' ? 'Drinks' : 'Food'}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '10px', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', marginBottom: '15px' }}>2. The Details</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
             <input
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ flex: 2, padding: '15px 20px', borderRadius: '15px', border: '1px solid #EEE', fontWeight: 'bold', outline: 'none' }}
             />
             <select
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                style={{ flex: 1, padding: '15px', borderRadius: '15px', border: '1px solid #EEE', fontWeight: 'bold', outline: 'none', backgroundColor: '#FFF' }}
             >
                {[2,4,6,8,10,12].map(n => <option key={n} value={n}>{n} PPL</option>)}
             </select>
          </div>

          <button
            onClick={searchVibe}
            style={{ width: '100%', backgroundColor: '#000', color: '#FFF', padding: '18px', borderRadius: '20px', border: 'none', fontWeight: '900', cursor: 'pointer', letterSpacing: '1px' }}
          >
            {loading ? 'SEARCHING...' : 'FIND OPTIONS'}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div key={place.id} style={{ position: 'relative', borderRadius: '35px', overflow: 'hidden', border: isSelected ? '5px solid #6366f1' : '1px solid #EEE', transition: '0.2s' }}>
              <div onClick={() => togglePlace(place)} style={{ height: '320px', cursor: 'pointer' }}>
                <img src={place.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '30px', left: '30px', color: '#FFF' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-0.5px' }}>{place.name}</h3>
                  <p style={{ fontSize: '13px', opacity: 0.9, marginTop: '4px', fontWeight: 'bold' }}>{place.rating} ★ • {place.price || '$$'}</p>
                </div>
              </div>

              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ position: 'absolute', top: '25px', left: '25px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '10px 18px', borderRadius: '15px', fontSize: '10px', fontWeight: '900', color: '#000', textDecoration: 'none', backdropFilter: 'blur(10px)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
              >
                📖 MENU & INFO
              </a>

              <div style={{ position: 'absolute', top: '25px', right: '25px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold', fontSize: '20px', backdropFilter: 'blur(5px)', cursor: 'pointer' }} onClick={() => togglePlace(place)}>
                {isSelected ? '✓' : '+'}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM ACTION BAR */}
      {selectedPlaces.length > 0 && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', backgroundColor: '#1A1A1A', padding: '18px 25px', borderRadius: '35px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <span style={{ color: '#FFF', fontWeight: '900', fontSize: '20px', display: 'block', lineHeight: 1 }}>{selectedPlaces.length}</span>
            <span style={{ color: '#777', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }}>Selected</span>
          </div>
          <button
            onClick={handleCreatePoll}
            style={{ backgroundColor: '#6366f1', color: '#FFF', border: 'none', padding: '14px 28px', borderRadius: '20px', fontWeight: '900', fontSize: '12px', cursor: 'pointer', letterSpacing: '0.5px' }}
          >
            CREATE GROUP POLL
          </button>
        </div>
      )}
    </div>
  );
}