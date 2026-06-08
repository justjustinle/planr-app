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

const WHERE_OPTIONS = [
  { value: 'central', label: 'Central' },
  { value: 'north',   label: 'North' },
  { value: 'east',    label: 'East' },
  { value: 'south',   label: 'South' },
  { value: 'west',    label: 'West' },
];

const WHAT_OPTIONS = [
  { value: 'eat',   label: 'Eat',   emoji: '🍽', sublabel: 'Restaurants & cafés',    bg: '#FF5C00', text: '#0A0A0A' },
  { value: 'drink', label: 'Drink', emoji: '🍸', sublabel: 'Bars & cocktails',        bg: '#0038FF', text: '#FFFFFF' },
  { value: 'play',  label: 'Play',  emoji: '🎮', sublabel: 'Activities & experiences', bg: '#0A3D2A', text: '#FFFFFF' },
];

const WHO_OPTIONS = [
  { value: 'romantic',    label: 'Romantic',    emoji: '💫', sublabel: 'Date night' },
  { value: 'squad',       label: 'Squad',       emoji: '👥', sublabel: 'Group energy' },
  { value: 'celebration', label: 'Celebration', emoji: '🎉', sublabel: 'Special occasion' },
  { value: 'playful',     label: 'Playful',     emoji: '😄', sublabel: 'Fun & silly' },
  { value: 'lowkey',      label: 'Lowkey',      emoji: '🌙', sublabel: 'Chill & easy' },
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

  const stepLabels = ['WHERE', 'WHAT', 'WHO'];

  return (
    <div className="min-h-screen bg-white pb-32">

      {/* ── MASTHEAD ── */}
      <header className="border-b-2 border-ink px-5 pt-8 pb-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-end justify-between">
            <h1 className="font-headline text-7xl leading-none tracking-tighter text-ink">
              PLANR.
            </h1>
            {/* Step counter */}
            {step < STEP.RESULTS && (
              <div className="text-right mb-1">
                <span className="font-headline text-4xl text-ink leading-none"
                  style={{ fontVariantNumeric: 'tabular-nums' }}>
                  0{step}
                </span>
                <span className="font-headline text-lg text-gray-300 leading-none">/03</span>
              </div>
            )}
          </div>

          {/* Step tabs */}
          {step < STEP.RESULTS && (
            <div className="flex gap-0 mt-4 border-2 border-ink" style={{ width: 'fit-content' }}>
              {stepLabels.map((label, i) => {
                const s = i + 1;
                const isActive = step === s;
                const isDone = step > s;
                return (
                  <div
                    key={label}
                    className={`px-4 py-1.5 font-headline text-xs tracking-widest border-r-2 border-ink last:border-r-0 ${
                      isActive ? 'bg-ink text-white' : isDone ? 'bg-[#FF5C00] text-ink' : 'bg-white text-gray-300'
                    }`}
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
      <div className="max-w-md mx-auto px-5 pt-6">

        {/* Back */}
        {step > STEP.WHERE && (
          <button
            onClick={back}
            className="mb-5 font-headline text-sm tracking-widest text-gray-400 hover:text-ink transition-none uppercase flex items-center gap-2"
          >
            ← Back
          </button>
        )}

        {/* ── STEP 1: WHERE ── */}
        {step === STEP.WHERE && (
          <div className="animate-fade-in">
            <p className="font-headline text-5xl tracking-tighter text-ink mb-6">
              WHERE<br />IN LONDON?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHERE_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
                  <SelectionCard
                    label={opt.label}
                    selected={neighborhood === opt.value}
                    onClick={() => pickNeighborhood(opt.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: WHAT ── */}
        {step === STEP.WHAT && (
          <div className="animate-fade-in">
            <p className="font-headline text-5xl tracking-tighter text-ink mb-6">
              WHAT'S<br />THE PLAN?
            </p>
            <div className="flex flex-col gap-3">
              {WHAT_OPTIONS.map(opt => {
                const isSelected = activityType === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => pickActivity(opt.value)}
                    style={isSelected
                      ? { backgroundColor: opt.bg, color: opt.text, borderColor: opt.bg, boxShadow: 'none', transform: 'translate(4px,4px)' }
                      : { backgroundColor: opt.bg, color: opt.text }
                    }
                    className={`
                      w-full border-2 border-ink p-6 text-left transition-none
                      ${!isSelected ? 'brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-headline text-4xl tracking-tighter leading-none uppercase">
                          {opt.emoji} {opt.label}
                        </p>
                        <p className="font-body text-sm mt-2 opacity-70">{opt.sublabel}</p>
                      </div>
                      <span className="font-headline text-3xl opacity-40">→</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 3: WHO ── */}
        {step === STEP.WHO && (
          <div className="animate-fade-in">
            <p className="font-headline text-5xl tracking-tighter text-ink mb-6">
              WHAT'S THE<br />ENERGY?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {WHO_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
                  <SelectionCard
                    emoji={opt.emoji}
                    label={opt.label}
                    sublabel={opt.sublabel}
                    selected={energyTag === opt.value}
                    onClick={() => pickEnergy(opt.value)}
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
              <div className="flex flex-col items-center justify-center py-32 gap-6">
                {/* Brutalist loading — no spinner, just pulsing text */}
                <p className="font-headline text-4xl tracking-tighter animate-pulse">FINDING<br />YOUR SPOT…</p>
              </div>
            ) : (
              <>
                {/* Results masthead */}
                <div className="border-b-2 border-ink pb-4 mb-6">
                  <div className="flex gap-2 flex-wrap mb-2">
                    {[neighborhood, activityType, !fuzzy && energyTag].filter(Boolean).map(tag => (
                      <span key={tag} className="font-headline text-xs tracking-widest uppercase border border-ink px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="font-headline text-5xl tracking-tighter text-ink leading-none">
                    {venues.length} SPOT{venues.length !== 1 ? 'S' : ''}
                  </p>
                  <p className="font-body text-xs text-gray-500 mt-1">Tap a card to add to your group poll</p>
                </div>

                {/* Fuzzy match banner */}
                {fuzzy && fuzzyMeta && (
                  <div className="border-2 border-ink bg-[#FF5C00] p-4 mb-6" style={{ boxShadow: '4px 4px 0 #0A0A0A' }}>
                    <p className="font-headline text-xs tracking-widest uppercase mb-1">Heads up</p>
                    <p className="font-body text-sm font-semibold leading-snug">
                      Nothing fits &ldquo;<span className="uppercase font-black">{fuzzyMeta.requested}</span>&rdquo; here right now — showing you the next best thing.
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {venues.length === 0 && (
                  <div className="border-2 border-ink p-10 text-center">
                    <p className="font-headline text-5xl tracking-tighter mb-3">DEAD END.</p>
                    <p className="font-body text-sm text-gray-500">No venues match this combo. Go back and try another.</p>
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
                        style={isSelected
                          ? { boxShadow: 'none', transform: 'translate(4px,4px)' }
                          : { boxShadow: '4px 4px 0 #0A0A0A' }
                        }
                        className={`border-2 border-ink cursor-pointer transition-none overflow-hidden ${
                          isSelected ? 'bg-ink' : 'bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm'
                        }`}
                      >
                        {/* 4:3 Image */}
                        <div className="relative w-full border-b-2 border-ink" style={{ aspectRatio: '4/3' }}>
                          {venue.hero_image_url ? (
                            <img
                              src={venue.hero_image_url}
                              alt={venue.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-cream flex items-center justify-center">
                              <span className="font-headline text-2xl text-gray-300 tracking-tighter">NO IMAGE</span>
                            </div>
                          )}

                          {/* Logistics badge */}
                          {venue.logistics_badge && (
                            <div className="absolute top-3 left-3 bg-white border border-ink px-2 py-1">
                              <span className="font-headline text-[10px] tracking-widest uppercase text-ink">
                                {venue.logistics_badge}
                              </span>
                            </div>
                          )}

                          {/* Energy tag */}
                          <div className="absolute top-3 right-3 bg-[#FF5C00] border border-ink px-2 py-1">
                            <span className="font-headline text-[10px] tracking-widest uppercase text-ink">
                              {venue.energy_tag}
                            </span>
                          </div>

                          {/* Select state overlay */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-ink/60 flex items-center justify-center">
                              <span className="font-headline text-5xl text-white tracking-tighter">ADDED ✓</span>
                            </div>
                          )}
                        </div>

                        {/* Info block */}
                        <div className={`p-4 ${isSelected ? 'bg-ink' : 'bg-white'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className={`font-headline text-2xl tracking-tighter leading-none uppercase ${isSelected ? 'text-white' : 'text-ink'}`}>
                              {venue.name}
                            </h3>
                            <div className={`flex-shrink-0 w-8 h-8 border-2 flex items-center justify-center font-headline text-lg ${
                              isSelected
                                ? 'border-white text-white'
                                : 'border-ink text-ink bg-white'
                            }`}>
                              {isSelected ? '✓' : '+'}
                            </div>
                          </div>
                          {venue.pro_tip && (
                            <p className={`font-body text-xs mt-3 leading-relaxed italic ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
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

      {/* ── FIXED POLL BAR ── */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-ink border-t-2 border-ink z-50">
          <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <span className="font-headline text-3xl text-white tracking-tighter leading-none block">
                {selected.length}/5
              </span>
              <span className="font-body text-[10px] text-gray-400 uppercase tracking-widest">Selected</span>
            </div>
            <button
              onClick={createPoll}
              disabled={pollCreating}
              style={{ boxShadow: '3px 3px 0 #FF5C00' }}
              className="bg-white text-ink border-2 border-white font-headline text-sm tracking-widest uppercase px-6 py-3 hover:bg-[#FF5C00] hover:border-[#FF5C00] transition-none disabled:opacity-50"
            >
              {pollCreating ? 'CREATING…' : 'CREATE POLL →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
