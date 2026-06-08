'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import SelectionCard from './SelectionCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STEP = { WHERE: 0, WHAT: 1, WHO: 2, RESULTS: 3 };

const STEP_THEME = {
  [STEP.WHERE]:   { bg: '#F8E98A', fg: '#0A0A0A' },
  [STEP.WHAT]:    { bg: '#7188F0', fg: '#0A0A0A' },
  [STEP.WHO]:     { bg: '#F8976F', fg: '#0A0A0A' },
  [STEP.RESULTS]: { bg: '#F8E98A', fg: '#0A0A0A' },
};

const DISPLAY = {
  fontFamily: '"Barlow Condensed", "Arial Black", Impact, sans-serif',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 0.85,
  textTransform: 'uppercase',
};

const META = {
  fontFamily: 'Barlow, system-ui, sans-serif',
  fontWeight: 400,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.65rem',
};

const WHERE_OPTIONS = [
  { value: 'Central', label: 'Central' },
  { value: 'North',   label: 'North'   },
  { value: 'East',    label: 'East'    },
  { value: 'South',   label: 'South'   },
  { value: 'West',    label: 'West'    },
];

const WHAT_OPTIONS = [
  { value: 'restaurants',  label: 'Food',     sublabel: 'restaurants & dining' },
  { value: 'cocktailbars', label: 'Drinks',   sublabel: 'bars & cocktail spots' },
  { value: 'active',       label: 'Activity', sublabel: 'experiences & events'  },
];

const WHO_OPTIONS = [
  { value: 'romantic',    label: 'Romantic',    sublabel: 'intimate rooms & dim lighting'    },
  { value: 'squad',       label: 'Squad',       sublabel: 'group tables & sharing plates'    },
  { value: 'celebration', label: 'Celebration', sublabel: 'special occasions & milestones'   },
  { value: 'buzzy',       label: 'Buzzy',       sublabel: 'high energy & loud rooms'         },
  { value: 'lowkey',      label: 'Lowkey',      sublabel: 'chill spots & effortless food'    },
];

function BackButton({ onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...META,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color,
        opacity: 0.6,
        padding: '12px 0',
        display: 'block',
        width: '100%',
        textAlign: 'center',
      }}
    >
      ← BACK
    </button>
  );
}

export default function WizardContainer() {
  const [step, setStep] = useState(STEP.WHERE);
  const [where, setWhere] = useState(null);
  const [what, setWhat] = useState(null);
  const [who, setWho] = useState(null);
  const [results, setResults] = useState([]);
  const [fuzzy, setFuzzy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const router = useRouter();

  const theme = STEP_THEME[step];

  const fetchVenues = async (neighborhood, activity_type, energy_tag) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ neighborhood, activity_type, energy_tag });
      const res = await fetch(`/api/venues?${params}`);
      const data = await res.json();
      setResults(data.venues || []);
      setFuzzy(data.fuzzy || false);
    } catch (err) {
      console.error(err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleWhere = (val) => {
    setWhere(val);
    setStep(STEP.WHAT);
  };

  const handleWhat = (val) => {
    setWhat(val);
    setStep(STEP.WHO);
  };

  const handleWho = (val) => {
    setWho(val);
    setStep(STEP.RESULTS);
    fetchVenues(where, val === 'restaurants' ? what : what, val);
  };

  const togglePlace = (place) => {
    setSelectedPlaces((prev) => {
      const already = prev.find((p) => p.id === place.id);
      if (already) return prev.filter((p) => p.id !== place.id);
      if (prev.length < 5) return [...prev, place];
      return prev;
    });
  };

  const handleCreatePoll = async () => {
    if (selectedPlaces.length === 0) return;
    const { data, error } = await supabase.from('polls').insert([{
      restaurants: selectedPlaces,
      location: where,
      votes: {},
      is_closed: false,
      activity_type: what,
      energy_tag: who,
    }]).select();
    if (error) { console.error(error); return; }
    router.push(`/poll/${data[0].id}`);
  };

  const stepLabel = (s) => ['WHERE', 'WHAT', 'WHO', 'PICK'][s];

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', transition: 'background-color 0.4s', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
        <h1 style={{ ...DISPLAY, fontSize: '6rem', color: '#0A0A0A', margin: 0 }}>PLANR.</h1>
        <p style={{ ...META, color: '#0A0A0A', opacity: 0.5, marginTop: '8px' }}>
          STEP {step + 1} OF 4 — {stepLabel(step)}
        </p>
      </header>

      <div style={{ flex: 1, maxWidth: '480px', width: '100%', margin: '0 auto', padding: '0 20px 120px' }}>

        {/* STEP 0: WHERE */}
        {step === STEP.WHERE && (
          <>
            <h2 style={{ ...DISPLAY, fontSize: '3.5rem', color: '#0A0A0A', margin: '0 0 24px' }}>
              Where in<br />London?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {WHERE_OPTIONS.map((o) => (
                <SelectionCard
                  key={o.value}
                  label={o.label}
                  selected={where === o.value}
                  onClick={() => handleWhere(o.value)}
                />
              ))}
            </div>
          </>
        )}

        {/* STEP 1: WHAT */}
        {step === STEP.WHAT && (
          <>
            <h2 style={{ ...DISPLAY, fontSize: '3.5rem', color: '#0A0A0A', margin: '0 0 24px' }}>
              What's<br />the vibe?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WHAT_OPTIONS.map((o) => (
                <SelectionCard
                  key={o.value}
                  label={o.label}
                  sublabel={o.sublabel}
                  selected={what === o.value}
                  onClick={() => handleWhat(o.value)}
                />
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <BackButton onClick={() => setStep(STEP.WHERE)} color={theme.fg} />
            </div>
          </>
        )}

        {/* STEP 2: WHO */}
        {step === STEP.WHO && (
          <>
            <h2 style={{ ...DISPLAY, fontSize: '3.5rem', color: '#0A0A0A', margin: '0 0 24px' }}>
              Who's<br />coming?
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {WHO_OPTIONS.map((o) => (
                <SelectionCard
                  key={o.value}
                  label={o.label}
                  sublabel={o.sublabel}
                  selected={who === o.value}
                  onClick={() => handleWho(o.value)}
                />
              ))}
            </div>
            <div style={{ marginTop: '20px' }}>
              <BackButton onClick={() => setStep(STEP.WHAT)} color={theme.fg} />
            </div>
          </>
        )}

        {/* STEP 3: RESULTS */}
        {step === STEP.RESULTS && (
          <>
            <h2 style={{ ...DISPLAY, fontSize: '3.5rem', color: '#0A0A0A', margin: '0 0 8px' }}>
              Pick your<br />spots.
            </h2>
            <p style={{ ...META, color: '#0A0A0A', opacity: 0.5, marginBottom: '24px' }}>
              SELECT UP TO 5 · {selectedPlaces.length} CHOSEN
            </p>

            {loading && (
              <p style={{ ...META, color: '#0A0A0A', opacity: 0.6, textAlign: 'center', padding: '40px 0' }}>
                LOADING...
              </p>
            )}

            {fuzzy && !loading && (
              <div style={{ backgroundColor: 'rgba(0,0,0,0.08)', border: '2px solid #0A0A0A', padding: '12px 16px', marginBottom: '20px' }}>
                <p style={{ ...META, margin: 0, color: '#0A0A0A' }}>
                  No exact matches — showing nearby results
                </p>
              </div>
            )}

            {!loading && results.length === 0 && (
              <p style={{ ...META, color: '#0A0A0A', opacity: 0.5, textAlign: 'center', padding: '40px 0' }}>
                NO VENUES FOUND
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {results.map((venue) => {
                const isSelected = !!selectedPlaces.find((p) => p.id === venue.id);
                return (
                  <div
                    key={venue.id}
                    onClick={() => togglePlace(venue)}
                    style={{
                      position: 'relative',
                      borderRadius: 0,
                      overflow: 'hidden',
                      border: isSelected ? '5px solid #0A0A0A' : '2px solid #0A0A0A',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'none' : '5px 5px 0px 0px rgba(0,0,0,1)',
                      transform: isSelected ? 'translate(5px,5px)' : 'none',
                      transition: 'none',
                    }}
                  >
                    <div style={{ height: '280px' }}>
                      <img
                        src={venue.hero_image_url}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        alt=""
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '80px', color: '#FFF' }}>
                      <h3 style={{ ...DISPLAY, fontSize: '1.6rem', margin: 0 }}>{venue.name}</h3>
                      <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.75rem', opacity: 0.8, marginTop: '4px' }}>
                        {venue.neighborhood} · {venue.logistics_badge || ''}
                      </p>
                    </div>

                    <div style={{
                      position: 'absolute', bottom: '20px', right: '20px',
                      width: '44px', height: '44px',
                      backgroundColor: isSelected ? '#0A0A0A' : 'rgba(255,255,255,0.9)',
                      border: '2px solid #0A0A0A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '1.2rem',
                      color: isSelected ? '#FFF' : '#0A0A0A',
                    }}>
                      {isSelected ? '✓' : '+'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '20px' }}>
              <BackButton onClick={() => { setStep(STEP.WHO); setResults([]); setSelectedPlaces([]); }} color={theme.fg} />
            </div>
          </>
        )}
      </div>

      {/* Bottom action bar */}
      {selectedPlaces.length > 0 && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          width: '90%', maxWidth: '420px',
          backgroundColor: '#0A0A0A', padding: '16px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 100,
          border: '2px solid #0A0A0A',
          boxShadow: '5px 5px 0px 0px rgba(0,0,0,0.3)',
        }}>
          <div>
            <span style={{ ...DISPLAY, color: '#FFF', fontSize: '1.8rem', display: 'block' }}>{selectedPlaces.length}</span>
            <span style={{ ...META, color: 'rgba(255,255,255,0.5)' }}>SELECTED</span>
          </div>
          <button
            onClick={handleCreatePoll}
            style={{
              ...DISPLAY,
              fontSize: '0.85rem',
              backgroundColor: '#F8E98A',
              color: '#0A0A0A',
              border: '2px solid #F8E98A',
              padding: '14px 24px',
              cursor: 'pointer',
              letterSpacing: '-0.02em',
            }}
          >
            CREATE POLL
          </button>
        </div>
      )}
    </div>
  );
}
