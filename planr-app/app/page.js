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
  const [activity, setActivity] = useState('restaurants'); // restaurants, bars, active
  const [groupSize, setGroupSize] = useState('4');
  const [results, setResults] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const searchVibe = async () => {
    if (!city) return;
    setLoading(true);
    // We pass 'activity' to our API to filter Yelp categories
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
    const { data, error } = await supabase.from('polls').insert([{
      restaurants: selectedPlaces,
      location: city,
      votes: {},
      is_closed: false,
      metadata: { activity, groupSize } // Storing the vibe
    }]).select();
    if (!error) router.push(`/poll/${data[0].id}`);
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
                style={{ flex: 2, padding: '15px 20px', borderRadius: '15px', border: '1px solid #EEE', fontWeight: 'bold' }}
             />
             <select
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
                style={{ flex: 1, padding: '15px', borderRadius: '15px', border: '1px solid #EEE', fontWeight: 'bold' }}
             >
                {[2,4,6,8,10].map(n => <option key={n} value={n}>{n} People</option>)}
             </select>
          </div>

          <button
            onClick={searchVibe}
            style={{ width: '100%', backgroundColor: '#000', color: '#FFF', padding: '18px', borderRadius: '20px', border: 'none', fontWeight: '900', cursor: 'pointer' }}
          >
            {loading ? 'Searching...' : 'Find Options'}
          </button>
        </div>
      </div>

      {/* RESULTS */}
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div key={place.id} style={{ position: 'relative', borderRadius: '35px', overflow: 'hidden', border: isSelected ? '5px solid #6366f1' : '1px solid #EEE' }}>
              <div onClick={() => togglePlace(place)} style={{ height: '300px', cursor: 'pointer' }}>
                <img src={place.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                <div style={{ position: 'absolute', bottom: '25px', left: '25px', color: '#FFF' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>{place.name}</h3>
                  <p style={{ fontSize: '12px', opacity: 0.8 }}>{place.rating} ★ • {place.price || '$$'}</p>
                </div>
              </div>

              {/* NEW: MENU LINK */}
              <a
                href={place.url}
                target="_blank"
                style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '8px 15px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', color: '#000', textDecoration: 'none', backdropFilter: 'blur(5px)' }}
              >
                📖 VIEW MENU
              </a>

              <div style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: isSelected ? '#6366f1' : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold' }}>
                {isSelected ? '✓' : '+'}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM BAR */}
      {selectedPlaces.length > 0 && (
        <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', backgroundColor: '#000', padding: '20px', borderRadius: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
          <span style={{ color: '#FFF', fontWeight: '900', marginLeft: '10px' }}>{selectedPlaces.length} Picked</span>
          <button onClick={handleCreatePoll} style={{ backgroundColor: '#6366f1', color: '#FFF', border: 'none', padding: '12px 25px', borderRadius: '20px', fontWeight: '900' }}>CREATE POLL</button>
        </div>
      )}
    </div>
  );
}