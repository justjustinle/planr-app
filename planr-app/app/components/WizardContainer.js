'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SelectionCard from './SelectionCard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const STEP = { WHERE: 1, WHAT: 2, WHO: 3, RESULTS: 4 };

// Per-step: background + foreground text color for titles/UI chrome
const STEP_THEME = {
  [STEP.WHERE]:   { bg: '#F8E98A', fg: '#0A0A0A', shadow: 'rgba(0,0,0,1)' },
  [STEP.WHAT]:    { bg: '#7188F0', fg: '#0A0A0A', shadow: 'rgba(0,0,0,1)' },
  [STEP.WHO]:     { bg: '#F8976F', fg: '#0A0A0A', shadow: 'rgba(0,0,0,1)' },
  [STEP.RESULTS]: { bg: '#F8E98A', fg: '#0A0A0A', shadow: 'rgba(0,0,0,1)' },
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
  { value: 'romantic',    label: 'Romantic',    sublabel: 'Date night' },
  { value: 'squad',       label: 'Squad',       sublabel: 'Group energy' },
  { value: 'celebration', label: 'Celebration', sublabel: 'Special occasion' },
  { value: 'playful',     label: 'Playful',     sublabel: 'Fun & silly' },
  { value: 'lowkey',      label: 'Lowkey',      sublabel: 'Chill & easy' },
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
  const isLight = true; // all pastel steps use dark text

  const pickNeighborhood = (value) => {
    setNeighborhood(value);
    setTimeout(() => setStep(STEP.WHAT), 160);
  };

  const pickActivity = (value) => {
    setActivityType(value);
    setTimeout(() => setStep(STEP.WHO), 160);
  };

  const pickEnergy = async (value) => {
    setEnergyTag(value);
    setLoading(true);
    setStep(STEP.RESULTS);
    try {
      const res = await fetch(
        `/api/venues?neighborhood=${neighborhood}&activity_type=${activityType}&energy_tag=${value}`
      );
      const data = await res.json();
      setVenues(data.venues || []);
      setFuzzy(!!data.fuzzy);
      setFuzzyMeta(data.fuzzy ? { requested: value, available: data.availableEnergies || [] } : null);
    } catch (e) {
      console.error(e);
    }
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
      restaurants: selected,
      location: neighborhood,
      votes: {},
      is_closed: false,
      activity_type: activityType,
    }]).select();
    if (!error) router.push(`/poll/${data[0].id}`);
    else setPollCreating(false);
  };

  const back = () => {
    if (step === STEP.WHAT)    { setActivityType(null); setStep(STEP.WHERE); }
    if (step === STEP.WHO)     { setEnergyTag(null);    setStep(STEP.WHAT); }
    if (step === STEP.RESULTS) { setVenues([]); setSelected([]); setFuzzy(false); setFuzzyMeta(null); setStep(STEP.WHO); }
  };

  return (
    <div
      className="min-h-screen pb-32"
      style={{ backgroundColor: bg, transition: 'background-color 0.4s ease' }}
    >

      {/* ── MASTHEAD ── */}
      <header
        className="border-b-2 border-black px-5 pt-8 pb-5"
        style={{ borderColor: isLight ? '#0A0A0A' : '#0A0A0A' }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-end justify-between">
            <h1
              className="font-headline text-7xl leading-none tracking-tighter"
              style={{
                color: fg,
                filter: isLight ? 'none' : 'drop-shadow(2px 2px 0 rgba(0,0,0,1))',
              }}
            >
              PLANR.
            </h1>
            {step < STEP.RESULTS && (
              <span
                className="font-headline text-2xl leading-none mb-1"
                style={{ color: fg, opacity: 0.4 }}
              >
                0{step}&thinsp;/&thinsp;03
              </span>
            )}
          </div>

          {/* Step tab strip */}
          {step < STEP.RESULTS && (
            <div className="flex mt-5 border-2 border-black" style={{ width: 'fit-content' }}>
              {['WHERE', 'WHAT', 'WHO'].map((label, i) => {
                const s = i + 1;
                const isActive = step === s;
                const isDone   = step > s;
                return (
                  <div
                    key={label}
                    className="px-4 py-1.5 font-headline text-[10px] tracking-widest border-r-2 border-black last:border-r-0"
                    style={isActive
                      ? { backgroundColor: '#0A0A0A', color: bg }
                      : isDone
                      ? { backgroundColor: '#0A0A0A', color: bg, opacity: 0.4 }
                      : { backgroundColor: 'transparent', color: fg, opacity: 0.3 }
                    }
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
      <div className="max-w-md mx-auto px-5 pt-7">

        {step > STEP.WHERE && (
          <button
            onClick={back}
            className="mb-6 font-headline text-xs tracking-widest uppercase"
            style={{ color: fg, opacity: 0.5, transition: 'none' }}
          >
            ← Back
          </button>
        )}

        {/* ── STEP 1: WHERE ── */}
        {step === STEP.WHERE && (
          <div className="animate-fade-in">
            <h2 className="font-headline text-7xl tracking-tight leading-tight mb-3" style={{ color: fg, fontWeight: 800 }}>
              WHERE IN<br />LONDON?
            </h2>
            <p className="font-body text-xs tracking-widest uppercase mb-10" style={{ color: fg, opacity: 0.5 }}>
              Select your neighbourhood
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHERE_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
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
          <div className="animate-fade-in">
            <h2
              className="font-headline text-7xl tracking-tight leading-tight mb-3"
              style={{ color: fg, fontWeight: 800 }}
            >
              WHAT'S<br />THE PLAN?
            </h2>
            <p className="font-body text-xs tracking-widest uppercase mb-10" style={{ color: fg, opacity: 0.6 }}>
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
          </div>
        )}

        {/* ── STEP 3: WHO ── */}
        {step === STEP.WHO && (
          <div className="animate-fade-in">
            <h2
              className="font-headline text-7xl tracking-tight leading-tight mb-3"
              style={{ color: fg, fontWeight: 800 }}
            >
              WHAT'S THE<br />ENERGY?
            </h2>
            <p className="font-body text-xs tracking-widest uppercase mb-10" style={{ color: fg, opacity: 0.6 }}>
              Set the vibe
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHO_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
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
          </div>
        )}

        {/* ── STEP 4: RESULTS ── */}
        {step === STEP.RESULTS && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="pt-32 text-center">
                <p
                  className="font-headline text-5xl tracking-tighter animate-pulse"
                  style={{ color: fg }}
                >
                  FINDING<br />YOUR SPOT…
                </p>
              </div>
            ) : (
              <>
                {/* Results header */}
                <div className="border-b-2 border-black pb-5 mb-6">
                  <div className="flex gap-2 flex-wrap mb-3">
                    {[neighborhood, activityType, !fuzzy && energyTag].filter(Boolean).map(tag => (
                      <span
                        key={tag}
                        className="font-headline text-[10px] tracking-widest uppercase border border-black px-2 py-0.5 bg-white text-black"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="font-headline text-5xl tracking-tighter text-black leading-none">
                    {venues.length} SPOT{venues.length !== 1 ? 'S' : ''}
                  </p>
                  <p className="font-body text-xs text-black/40 tracking-widest uppercase mt-1">
                    Tap to add to your group poll
                  </p>
                </div>

                {/* Fuzzy banner */}
                {fuzzy && fuzzyMeta && (
                  <div
                    className="border-2 border-black bg-white p-4 mb-6"
                    style={{ boxShadow: '4px 4px 0 #0A0A0A' }}
                  >
                    <p className="font-headline text-xs tracking-widest uppercase text-black/50 mb-1">Heads up</p>
                    <p className="font-body text-sm font-semibold leading-snug text-black">
                      Nothing fits &ldquo;<span className="uppercase font-black">{fuzzyMeta.requested}</span>&rdquo; right now — showing you the next best thing.
                    </p>
                  </div>
                )}

                {/* Empty */}
                {venues.length === 0 && (
                  <div className="border-2 border-black bg-white p-10 text-center">
                    <p className="font-headline text-4xl tracking-tighter text-black mb-2">DEAD END.</p>
                    <p className="font-body text-sm text-black/50">Try a different combination.</p>
                  </div>
                )}

                {/* Venue cards */}
                <div className="flex flex-col gap-4">
                  {venues.map(venue => {
                    const isSelected = !!selected.find(v => v.id === venue.id);
                    return (
                      <div
                        key={venue.id}
                        onClick={() => toggleVenue(venue)}
                        className="border-2 border-black cursor-pointer overflow-hidden bg-white"
                        style={isSelected
                          ? { boxShadow: 'none', transform: 'translate(6px, 6px)' }
                          : { boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)' }
                        }
                      >
                        {/* 4:3 image */}
                        <div className="relative w-full border-b-2 border-black" style={{ aspectRatio: '4/3' }}>
                          {venue.hero_image_url ? (
                            <img src={venue.hero_image_url} alt={venue.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#FCE22A] flex items-center justify-center">
                              <span className="font-headline text-xl tracking-tighter text-black/30 uppercase">No Image</span>
                            </div>
                          )}
                          {venue.logistics_badge && (
                            <div className="absolute top-3 left-3 bg-white border border-black px-2 py-1">
                              <span className="font-headline text-[10px] tracking-widest uppercase text-black">{venue.logistics_badge}</span>
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white border border-black px-2 py-1">
                            <span className="font-headline text-[10px] tracking-widest uppercase text-black capitalize">{venue.energy_tag}</span>
                          </div>
                          {isSelected && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="font-headline text-4xl text-white tracking-tighter">ADDED ✓</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-4" style={{ backgroundColor: isSelected ? '#0A0A0A' : '#FFFFFF' }}>
                          <div className="flex items-start justify-between gap-3">
                            <h3
                              className="font-headline text-2xl tracking-tighter leading-none uppercase"
                              style={{ color: isSelected ? '#FFFFFF' : '#0A0A0A' }}
                            >
                              {venue.name}
                            </h3>
                            <div
                              className="flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center font-headline text-base"
                              style={isSelected
                                ? { borderColor: '#FFFFFF', color: '#FFFFFF', backgroundColor: '#0A0A0A' }
                                : { borderColor: '#0A0A0A', color: '#0A0A0A', backgroundColor: '#FFFFFF' }
                              }
                            >
                              {isSelected ? '✓' : '+'}
                            </div>
                          </div>
                          {venue.pro_tip && (
                            <p
                              className="font-body text-xs mt-3 leading-relaxed italic"
                              style={{ color: isSelected ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}
                            >
                              &ldquo;{venue.pro_tip}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
              <span className="font-headline text-3xl text-white tracking-tighter leading-none block">{selected.length}/5</span>
              <span className="font-body text-[10px] text-white/40 tracking-widest uppercase">Selected</span>
            </div>
            <button
              onClick={createPoll}
              disabled={pollCreating}
              className="bg-white text-black border-2 border-white font-headline text-sm tracking-widest uppercase px-6 py-3 disabled:opacity-50"
              style={{ boxShadow: '3px 3px 0 rgba(255,255,255,0.25)', transition: 'none' }}
            >
              {pollCreating ? 'CREATING…' : 'CREATE POLL →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
