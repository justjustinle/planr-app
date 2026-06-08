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
  { value: 'eat',   label: 'Eat',   emoji: '🍽️', sublabel: 'Restaurants & cafés' },
  { value: 'drink', label: 'Drink', emoji: '🍸', sublabel: 'Bars & cocktails' },
  { value: 'play',  label: 'Play',  emoji: '🎮', sublabel: 'Activities & experiences' },
];

const WHO_OPTIONS = [
  { value: 'romantic',    label: 'Romantic',    emoji: '💫', sublabel: 'Date night vibes' },
  { value: 'squad',       label: 'Squad',       emoji: '👥', sublabel: 'Big group energy' },
  { value: 'celebration', label: 'Celebration', emoji: '🎉', sublabel: 'Special occasion' },
  { value: 'playful',     label: 'Playful',     emoji: '😄', sublabel: 'Fun & silly' },
  { value: 'lowkey',      label: 'Lowkey',      emoji: '🌙', sublabel: 'Chill & relaxed' },
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
    setTimeout(() => setStep(STEP.WHAT), 180);
  };

  const pickActivity = (value) => {
    setActivityType(value);
    setTimeout(() => setStep(STEP.WHO), 180);
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

  const progressPct = step === STEP.RESULTS ? 100 : ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-[#FFFDF9] pb-36">

      {/* Header */}
      <header className="text-center pt-12 pb-4 px-5">
        <h1 className="text-5xl font-black italic text-[#FAC898] tracking-tighter leading-none">PLANR.</h1>
        <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">London in 60 seconds</p>
      </header>

      {/* Progress bar */}
      <div className="max-w-md mx-auto px-5 mb-8 mt-4">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FAC898] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {step < STEP.RESULTS && (
          <div className="flex justify-between mt-2 px-0.5">
            {['Where?', 'What?', 'Who?'].map((label, i) => (
              <span
                key={label}
                className={`text-[10px] font-bold transition-colors ${
                  step === i + 1 ? 'text-[#FAC898]' : 'text-gray-200'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-5">

        {/* Back button */}
        {step > STEP.WHERE && (
          <button
            onClick={back}
            className="mb-5 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#FAC898] transition-colors"
          >
            ← Back
          </button>
        )}

        {/* STEP 1 — WHERE */}
        {step === STEP.WHERE && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Where?</h2>
            <p className="text-sm text-gray-400 mt-1.5 mb-6">Pick your part of London</p>
            <div className="grid grid-cols-2 gap-3">
              {WHERE_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
                  <SelectionCard
                    {...opt}
                    selected={neighborhood === opt.value}
                    onClick={() => pickNeighborhood(opt.value)}
                    size="lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — WHAT */}
        {step === STEP.WHAT && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">What?</h2>
            <p className="text-sm text-gray-400 mt-1.5 mb-6">What's the plan?</p>
            <div className="flex flex-col gap-3">
              {WHAT_OPTIONS.map(opt => (
                <SelectionCard
                  key={opt.value}
                  {...opt}
                  selected={activityType === opt.value}
                  onClick={() => pickActivity(opt.value)}
                  size="lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 — WHO */}
        {step === STEP.WHO && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">Who?</h2>
            <p className="text-sm text-gray-400 mt-1.5 mb-6">What's the energy tonight?</p>
            <div className="grid grid-cols-2 gap-3">
              {WHO_OPTIONS.map((opt, i) => (
                <div key={opt.value} className={i === 4 ? 'col-span-2' : ''}>
                  <SelectionCard
                    {...opt}
                    selected={energyTag === opt.value}
                    onClick={() => pickEnergy(opt.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4 — RESULTS */}
        {step === STEP.RESULTS && (
          <div className="animate-fade-in">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-28 gap-4">
                <div className="w-10 h-10 border-4 border-[#FAC898] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-400">Finding your spot…</p>
              </div>
            ) : (
              <>
                {/* Fuzzy match banner */}
                {fuzzy && fuzzyMeta && (
                  <div className="mb-5 bg-[#FAC898]/10 border border-[#FAC898]/40 rounded-2xl p-4">
                    <p className="text-xs font-black text-[#c8895a] uppercase tracking-wide mb-1">Heads up</p>
                    <p className="text-sm font-bold text-gray-700 leading-snug">
                      Nothing fits &ldquo;<span className="capitalize">{fuzzyMeta.requested}</span>&rdquo; here right now — but here&rsquo;s a great nearby spot you&rsquo;ll love!
                    </p>
                  </div>
                )}

                {/* Results header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#FAC898]/20 text-gray-700 text-xs font-black px-3 py-1 rounded-full capitalize">{neighborhood}</span>
                    <span className="bg-[#FAC898]/20 text-gray-700 text-xs font-black px-3 py-1 rounded-full capitalize">{activityType}</span>
                    {!fuzzy && (
                      <span className="bg-[#FAC898]/20 text-gray-700 text-xs font-black px-3 py-1 rounded-full capitalize">{energyTag}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-bold mt-2">
                    {venues.length} spot{venues.length !== 1 ? 's' : ''} found · tap to add to poll
                  </p>
                </div>

                {/* Empty state */}
                {venues.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-5xl mb-4">🏜️</p>
                    <p className="font-black text-gray-700 text-lg mb-2">No spots found</p>
                    <p className="text-sm text-gray-400">Try a different combination</p>
                  </div>
                )}

                {/* Venue cards */}
                <div className="flex flex-col gap-5">
                  {venues.map(venue => {
                    const isSelected = !!selected.find(v => v.id === venue.id);
                    return (
                      <div
                        key={venue.id}
                        onClick={() => toggleVenue(venue)}
                        className={`relative h-72 rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'ring-4 ring-[#FAC898] ring-offset-2 scale-[1.01]'
                            : 'ring-2 ring-gray-100 hover:ring-[#FAC898]/50'
                        }`}
                      >
                        {venue.hero_image_url ? (
                          <img src={venue.hero_image_url} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#FAC898] to-orange-300" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                        {/* Logistics badge */}
                        {venue.logistics_badge && (
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl">
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-wide">
                              {venue.logistics_badge}
                            </span>
                          </div>
                        )}

                        {/* Select toggle */}
                        <div className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black transition-all ${
                          isSelected
                            ? 'bg-[#FAC898] text-gray-900 shadow-lg'
                            : 'bg-black/30 backdrop-blur-sm text-white'
                        }`}>
                          {isSelected ? '✓' : '+'}
                        </div>

                        {/* Energy tag */}
                        <div className="absolute bottom-[4.5rem] left-5">
                          <span className="text-[9px] font-black text-white/50 uppercase tracking-widest capitalize">
                            {venue.energy_tag}
                          </span>
                        </div>

                        {/* Name + pro tip */}
                        <div className="absolute bottom-5 left-5 right-5 text-white">
                          <h3 className="text-xl font-black leading-tight">{venue.name}</h3>
                          {venue.pro_tip && (
                            <p className="text-xs text-white/65 mt-1.5 leading-relaxed">
                              💡 {venue.pro_tip}
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

      {/* Fixed poll creation bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-gray-900 rounded-[2rem] px-6 py-4 flex justify-between items-center shadow-2xl z-50 border border-white/10">
          <div>
            <span className="text-white font-black text-xl block leading-none">{selected.length}</span>
            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wide">of 5 selected</span>
          </div>
          <button
            onClick={createPoll}
            disabled={pollCreating}
            className="bg-[#FAC898] hover:bg-[#f8b87a] text-gray-900 px-6 py-3 rounded-2xl font-black text-xs tracking-wide transition-colors disabled:opacity-60"
          >
            {pollCreating ? 'Creating…' : 'CREATE GROUP POLL'}
          </button>
        </div>
      )}
    </div>
  );
}
