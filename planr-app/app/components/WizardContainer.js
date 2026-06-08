'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SelectionCard from './SelectionCard';
import VenueCard from './VenueCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STEP = { WHERE: 1, WHAT: 2, WHO: 3, RESULTS: 4 };

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
};

const WHERE_OPTIONS = [
  { value: 'central', label: 'Central' },
  { value: 'north',   label: 'North' },
  { value: 'east',    label: 'East' },
  { value: 'south',   label: 'South' },
  { value: 'west',    label: 'West' },
];

const WHAT_OPTIONS = [
  { value: 'eat',   label: 'Eat',   sublabel: 'Restaurants & cafés' },
  { value: 'drink', label: 'Drink', sublabel: 'Bars & cocktails' },
  { value: 'play',  label: 'Play',  sublabel: 'Activities & experiences' },
];

const WHO_OPTIONS = [
  { value: 'romantic',    label: 'Romantic',    sublabel: 'intimate rooms & dim lighting'  },
  { value: 'squad',       label: 'Squad',       sublabel: 'group tables & sharing plates'  },
  { value: 'celebration', label: 'Celebration', sublabel: 'special occasions & milestones' },
  { value: 'buzzy',       label: 'Buzzy',       sublabel: 'high energy & loud rooms'       },
  { value: 'lowkey',      label: 'Lowkey',      sublabel: 'chill spots & effortless food'  },
];

export default function WizardContainer() {
  const router = useRouter();
  const [step, setStep] = useState(STEP.WHERE);
  const [neighborhood, setNeighborhood] = useState(null);
  const [activityType, setActivityType] = useState(null);
  const [energyTag, setEnergyTag] = useState(null);
  const [venues, setVenues] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fuzzy, setFuzzy] = useState(false);
  const [fuzzyMeta, setFuzzyMeta] = useState(null);
  const [pollCreating, setPollCreating] = useState(false);

  const { bg, fg } = STEP_THEME[step];

  const pickNeighborhood = (value) => { setNeighborhood(value); setTimeout(() => setStep(STEP.WHAT), 160); };
  const pickActivity     = (value) => { setActivityType(value); setTimeout(() => setStep(STEP.WHO),  160); };

  const pickEnergy = async (value) => {
    setEnergyTag(value);
    setLoading(true);
    setStep(STEP.RESULTS);
    try {
      const res  = await fetch(`/api/venues?neighborhood=${neighborhood}&activity_type=${activityType}&energy_tag=${value}`);
      const data = await res.json();
      setVenues(data.venues || []);
      setFuzzy(!!data.fuzzy);
      setFuzzyMeta(data.fuzzy ? { requested: value, available: data.availableEnergies || [] } : null);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const toggleVenue = (venue) => {
    setSelected(prev => {
      if (prev.find(v => v.id === venue.id)) return prev.filter(v => v.id !== venue.id);
      if (prev.length >= 5) return prev;
      return [...prev, venue];
    });
  };

  const createPoll = async () => {
    if (!selected.length || pollCreating) return;
    setPollCreating(true);
    const { data, error } = await supabase.from('polls').insert([{
      restaurants: selected, location: neighborhood,
      votes: {}, is_closed: false, activity_type: activityType,
    }]).select();
    if (!error) router.push(`/poll/${data[0].id}`);
    else setPollCreating(false);
  };

  const back = () => {
    if (step === STEP.WHAT)    { setActivityType(null); setStep(STEP.WHERE); }
    if (step === STEP.WHO)     { setEnergyTag(null);    setStep(STEP.WHAT); }
    if (step === STEP.RESULTS) { setVenues([]); setSelected([]); setFuzzy(false); setFuzzyMeta(null); setStep(STEP.WHO); }
  };

  const BackButton = () => (
    <button
      onClick={back}
      className="mt-6 text-xs uppercase"
      style={{ ...META, color: fg, opacity: 0.45, transition: 'none' }}
    >
      ← Back
    </button>
  );

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: bg, transition: 'background-color 0.4s ease' }}
    >

      {/* ── MASTHEAD ── */}
      <header className="border-b-2 border-black px-5 pt-8 pb-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-end justify-between">
            <h1 style={{ ...DISPLAY, fontSize: '6rem', color: fg }}>PLANR.</h1>
            {step < STEP.RESULTS && (
              <span style={{ ...DISPLAY, fontSize: '1.5rem', color: fg, opacity: 0.35 }}>
                0{step}&thinsp;/&thinsp;03
              </span>
            )}
          </div>

          {step < STEP.RESULTS && (
            <div className="flex mt-5 border-2 border-black" style={{ width: 'fit-content' }}>
              {['WHERE', 'WHAT', 'WHO'].map((label, i) => {
                const s = i + 1;
                return (
                  <div
                    key={label}
                    className="px-4 py-1.5 border-r-2 border-black last:border-r-0"
                    style={{
                      ...META,
                      fontSize: '0.6rem',
                      ...(step === s
                        ? { backgroundColor: '#0A0A0A', color: bg }
                        : step > s
                        ? { backgroundColor: '#0A0A0A', color: bg, opacity: 0.35 }
                        : { backgroundColor: 'transparent', color: fg, opacity: 0.25 }),
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div className="max-w-md mx-auto px-5 pt-8">

        {step === STEP.RESULTS && (
          <button
            onClick={back}
            className="mb-6 text-xs uppercase"
            style={{ ...META, color: fg, opacity: 0.45, transition: 'none' }}
          >
            ← Back
          </button>
        )}

        {/* ── STEP 1: WHERE ── */}
        {step === STEP.WHERE && (
          <div className="animate-fade-in flex flex-col">
            <h2 style={{ ...DISPLAY, fontSize: '5rem', color: fg }} className="mb-4">
              WHERE IN<br />LONDON?
            </h2>
            <p className="text-xs mb-10" style={{ ...META, color: fg, opacity: 0.5 }}>
              Select your neighbourhood
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHERE_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <SelectionCard
                    label={opt.label}
                    selected={neighborhood === opt.value}
                    onClick={() => pickNeighborhood(opt.value)}
                    accentColor={bg}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: WHAT ── */}
        {step === STEP.WHAT && (
          <div className="animate-fade-in flex flex-col">
            <h2 style={{ ...DISPLAY, fontSize: '5rem', color: fg }} className="mb-4">
              WHAT'S<br />THE PLAN?
            </h2>
            <p className="text-xs mb-10" style={{ ...META, color: fg, opacity: 0.5 }}>
              Choose an activity
            </p>
            <div className="flex flex-col gap-3">
              {WHAT_OPTIONS.map(opt => (
                <SelectionCard
                  key={opt.value}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={activityType === opt.value}
                  onClick={() => pickActivity(opt.value)}
                  accentColor={bg}
                />
              ))}
            </div>
            <BackButton />
          </div>
        )}

        {/* ── STEP 3: WHO ── */}
        {step === STEP.WHO && (
          <div className="animate-fade-in flex flex-col">
            <h2 style={{ ...DISPLAY, fontSize: '5rem', color: fg }} className="mb-4">
              WHAT'S THE<br />ENERGY?
            </h2>
            <p className="text-xs mb-10" style={{ ...META, color: fg, opacity: 0.5 }}>
              Set the vibe
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHO_OPTIONS.map((opt) => (
                <div key={opt.value}>
                  <SelectionCard
                    label={opt.label}
                    sublabel={opt.sublabel}
                    selected={energyTag === opt.value}
                    onClick={() => pickEnergy(opt.value)}
                    accentColor={bg}
                  />
                </div>
              ))}
            </div>
            <BackButton />
          </div>
        )}

        {/* ── STEP 4: RESULTS ── */}
        {step === STEP.RESULTS && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="pt-32 text-center">
                <p style={{ ...DISPLAY, fontSize: '3rem', color: fg }} className="animate-pulse">
                  FINDING<br />YOUR SPOT…
                </p>
              </div>
            ) : (
              <>
                <div className="border-b-2 border-black pb-5 mb-6">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {[neighborhood, activityType, !fuzzy && energyTag].filter(Boolean).map(tag => (
                      <span
                        key={tag}
                        className="border border-black px-2 py-0.5 bg-white text-black"
                        style={{ ...META, fontSize: '0.6rem' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p style={{ ...DISPLAY, fontSize: '3.5rem', color: '#0A0A0A' }}>
                    {venues.length} SPOT{venues.length !== 1 ? 'S' : ''}
                  </p>
                  <p className="text-xs mt-2" style={{ ...META, color: 'rgba(0,0,0,0.4)' }}>
                    Tap to add to your group poll
                  </p>
                </div>

                {fuzzy && fuzzyMeta && (
                  <div className="border-2 border-black bg-white p-4 mb-6" style={{ boxShadow: '5px 5px 0 #0A0A0A' }}>
                    <p className="mb-1" style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.45)' }}>Heads up</p>
                    <p className="text-sm font-semibold leading-snug text-black">
                      Nothing fits &ldquo;<span style={DISPLAY}>{fuzzyMeta.requested}</span>&rdquo; right now — showing you the next best thing.
                    </p>
                  </div>
                )}

                {venues.length === 0 && (
                  <div className="border-2 border-black bg-white p-10 text-center">
                    <p style={{ ...DISPLAY, fontSize: '2.5rem', color: '#0A0A0A' }} className="mb-2">DEAD END.</p>
                    <p className="text-sm" style={{ ...META, color: 'rgba(0,0,0,0.45)', textTransform: 'none' }}>Try a different combination.</p>
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  {venues.map(venue => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      isSelected={!!selected.find(v => v.id === venue.id)}
                      onToggle={() => toggleVenue(venue)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── POLL BAR ── */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 border-t-2 border-black bg-black z-50">
          <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
            <div>
              <span style={{ ...DISPLAY, fontSize: '2rem', color: '#FFFFFF' }} className="block">{selected.length}/5</span>
              <span style={{ ...META, fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)' }}>Selected</span>
            </div>
            <button
              onClick={createPoll}
              disabled={pollCreating}
              className="bg-white text-black border-2 border-white px-6 py-3 disabled:opacity-50"
              style={{ ...META, fontSize: '0.75rem', boxShadow: '3px 3px 0 rgba(255,255,255,0.2)', transition: 'none' }}
            >
              {pollCreating ? 'CREATING…' : 'CREATE POLL →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
