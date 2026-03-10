"use client";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 1. Search for Restaurants via your API route
  const searchYelp = async () => {
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

  // 2. Manage the 5-restaurant limit
  const togglePlace = (place) => {
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

  // 3. Save to Supabase and Redirect
  const handleCreatePoll = async () => {
    const { data, error } = await supabase
      .from('polls')
      .insert([
        {
          restaurants: selectedPlaces,
          location: city,
          votes: {}
        }
      ])
      .select();

    if (error) {
      alert("Error creating poll: " + error.message);
    } else {
      // Redirect to the new poll page (we will build this next!)
      router.push(`/poll/${data[0].id}`);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Planr.</h1>
      <p>Where are we eating in <strong>{city || '...'}</strong>?</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter City (e.g. Oslo)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{ padding: '10px', flex: 1, borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={searchYelp} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {results.map((place) => {
          const isSelected = selectedPlaces.find((p) => p.id === place.id);
          return (
            <div
              key={place.id}
              onClick={() => togglePlace(place)}
              style={{
                border: isSelected ? '3px solid #FF5231' : '1px solid #eee',
                padding: '10px',
                borderRadius: '12px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#fff5f2' : '#fff'
              }}
            >
              <img src={place.image_url} alt={place.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              <h3 style={{ margin: '10px 0 5px 0', fontSize: '16px' }}>{place.name}</h3>
              <p style={{ fontSize: '12px', color: '#666' }}>{place.rating} ⭐ ({place.review_count} reviews)</p>
            </div>
          );
        })}
      </div>

      {selectedPlaces.length > 0 && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#fff', padding: '20px', borderRadius: '50px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span><strong>{selectedPlaces.length}</strong> selected (max 5)</span>
          <button
            onClick={handleCreatePoll}
            style={{ backgroundColor: '#FF5231', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Create Group Poll
          </button>
        </div>
      )}
    </div>
  );
}