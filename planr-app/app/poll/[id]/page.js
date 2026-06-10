"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const DISPLAY = {
  fontFamily: '"Barlow Condensed", "Arial Black", Impact, sans-serif',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 0.9,
  textTransform: 'uppercase',
};

const META = {
  fontFamily: 'Barlow, system-ui, sans-serif',
  fontWeight: 400,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
};

export default function PollPage({ params }) {
  const [poll, setPoll] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const [voting, setVoting] = useState(new Set());
  const pollId = params.id;

  useEffect(() => {
    const stored = localStorage.getItem(`index_votes_${pollId}`);
    if (stored) setMyVotes(JSON.parse(stored));

    async function getInitialPoll() {
      const { data } = await supabase.from('polls').select('*').eq('id', pollId).single();
      if (data) setPoll(data);
    }
    getInitialPoll();

    const channel = supabase.channel(`poll-${pollId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls', filter: `id=eq.${pollId}` },
        (payload) => setPoll(payload.new)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [pollId]);

  const vote = async (optionName) => {
    if (poll?.is_closed || voting.has(optionName)) return;
    const alreadyVoted = myVotes.includes(optionName);
    if (!alreadyVoted && myVotes.length >= 3) return;

    setVoting(prev => new Set(prev).add(optionName));

    // Fetch latest votes from DB to avoid stale-state race conditions
    const { data: fresh } = await supabase.from('polls').select('votes').eq('id', pollId).single();
    const currentVotes = fresh?.votes || {};

    const updatedMyVotes = alreadyVoted
      ? myVotes.filter(n => n !== optionName)
      : [...myVotes, optionName];
    const updatedVotes = {
      ...currentVotes,
      [optionName]: alreadyVoted
        ? Math.max((currentVotes[optionName] || 1) - 1, 0)
        : (currentVotes[optionName] || 0) + 1,
    };

    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
    localStorage.setItem(`index_votes_${pollId}`, JSON.stringify(updatedMyVotes));
    setMyVotes(updatedMyVotes);
    setVoting(prev => { const s = new Set(prev); s.delete(optionName); return s; });
  };

  const toggleClose = async () => {
    await supabase.from('polls').update({ is_closed: !poll?.is_closed }).eq('id', pollId);
  };

  if (!poll) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8E98A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ ...DISPLAY, fontSize: '3rem', color: '#0A0A0A' }}>LOADING…</p>
    </div>
  );

  const voteEntries = Object.entries(poll.votes || {});
  const maxVotes = voteEntries.length > 0 ? Math.max(...voteEntries.map(e => e[1])) : 0;
  const leaderName = maxVotes > 0 ? voteEntries.find(e => e[1] === maxVotes)?.[0] : null;
  const winner = poll.restaurants?.find(r => r.name === leaderName);

  return (
    <div style={{ backgroundColor: '#F8E98A', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* Header */}
      <header style={{ borderBottom: '2px solid #0A0A0A', padding: '32px 20px 20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h1 style={{ ...DISPLAY, fontSize: '5rem', color: '#0A0A0A', margin: 0 }}>INDEX.</h1>
            <div style={{
              border: '2px solid #0A0A0A',
              padding: '4px 12px',
              marginBottom: '8px',
              ...META,
              fontSize: '0.6rem',
              color: '#0A0A0A',
              backgroundColor: poll.is_closed ? '#0A0A0A' : 'transparent',
              color: poll.is_closed ? '#F8E98A' : '#0A0A0A',
            }}>
              {poll.is_closed ? 'VOTING CLOSED' : 'LIVE VOTE'}
            </div>
          </div>
          {!poll.is_closed && (
            <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.45)', marginTop: '8px' }}>
              Pick up to 3 · {myVotes.length}/3 voted
            </p>
          )}
        </div>
      </header>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>

        {/* Winner Banner */}
        {poll.is_closed && winner && (
          <div style={{ margin: '32px 0', border: '2px solid #0A0A0A', backgroundColor: '#0A0A0A', padding: '36px 24px', boxShadow: '6px 6px 0 #0A0A0A' }}>
            <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 8px' }}>THE VERDICT</p>
            <p style={{ ...DISPLAY, fontSize: '3.5rem', color: '#F8E98A', margin: 0 }}>{winner.name}</p>
            {winner.booking_action && (() => {
              const action = winner.booking_action.trim();
              const isWalkIn = action.toUpperCase() === 'WALK IN ONLY';
              const isPhone = /^[\d\s\+\(\)\-]+$/.test(action);
              const actionStyle = { ...META, fontSize: '0.65rem', marginTop: '16px', color: 'rgba(255,255,255,0.7)' };
              if (isWalkIn) return <p style={actionStyle}>This venue is walk in only</p>;
              if (isPhone) return <p style={actionStyle}>Please call: {action}</p>;
              return (
                <a
                  href={action}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '20px',
                    backgroundColor: '#F8E98A',
                    color: '#0A0A0A',
                    ...META,
                    fontSize: '0.7rem',
                    padding: '10px 24px',
                    border: '2px solid #F8E98A',
                    textDecoration: 'none',
                    boxShadow: '3px 3px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  BOOK NOW →
                </a>
              );
            })()}
          </div>
        )}

        {/* Venue Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: poll.is_closed && winner ? '0' : '32px' }}>
          {poll.restaurants?.map((opt) => {
            const votes = poll.votes?.[opt.name] || 0;
            const isWinning = votes > 0 && votes === maxVotes;
            const isMyVote = myVotes.includes(opt.name);
            const isMaxed = myVotes.length >= 3 && !isMyVote;
            const isDisabled = poll.is_closed || isMaxed || voting.has(opt.name);

            return (
              <div
                key={opt.name}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  border: isMyVote ? '5px solid #0A0A0A' : '2px solid #0A0A0A',
                  boxShadow: isMyVote ? 'none' : '5px 5px 0 #0A0A0A',
                  transform: isMyVote ? 'translate(5px,5px)' : 'none',
                  opacity: isMaxed ? 0.5 : 1,
                  backgroundColor: '#1A1A1A',
                }}
              >
                {/* Image */}
                <div style={{ height: '280px', position: 'relative' }}>
                  {opt.hero_image ? (
                    <>
                      <img src={opt.hero_image} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
                    </>
                  ) : (
                    <div style={{ height: '100%', backgroundColor: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <p style={{ ...DISPLAY, fontSize: '1.8rem', color: '#FFF', textAlign: 'center', padding: '0 20px' }}>{opt.name}</p>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '80px', color: '#FFF' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <h3 style={{ ...DISPLAY, fontSize: '1.6rem', margin: 0 }}>{opt.name}</h3>
                    {opt.price_range && (
                      <span style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.7rem', opacity: 0.75 }}>{opt.price_range}</span>
                    )}
                  </div>
                  {opt.neighborhood && (
                    <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.7rem', opacity: 0.7, margin: '2px 0 0' }}>{opt.neighborhood}</p>
                  )}
                </div>

                {/* Status badges */}
                {isMyVote && !poll.is_closed && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: '#F8E98A', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.55rem', color: '#0A0A0A' }}>
                    ✓ YOUR PICK
                  </div>
                )}
                {isWinning && !poll.is_closed && (
                  <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: '#0A0A0A', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.55rem', color: '#F8E98A' }}>
                    LEADING
                  </div>
                )}

                {/* Vote button */}
                <button
                  onClick={() => !isDisabled && vote(opt.name)}
                  disabled={isDisabled}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '16px',
                    width: '52px',
                    height: '52px',
                    backgroundColor: isMyVote ? '#0A0A0A' : 'rgba(255,255,255,0.92)',
                    border: '2px solid #0A0A0A',
                    cursor: isDisabled ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1px',
                  }}
                >
                  <span style={{ ...META, fontSize: '0.45rem', color: isMyVote ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                    {isMyVote ? 'VOTED' : 'VOTES'}
                  </span>
                  <span style={{ ...DISPLAY, fontSize: '1.4rem', color: isMyVote ? '#F8E98A' : '#0A0A0A', lineHeight: 1 }}>{votes}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Admin Toggle */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <button
            onClick={toggleClose}
            style={{
              background: 'none',
              border: '2px dashed rgba(0,0,0,0.25)',
              padding: '12px 28px',
              ...META,
              fontSize: '0.6rem',
              color: 'rgba(0,0,0,0.4)',
              cursor: 'pointer',
            }}
          >
            {poll.is_closed ? '↑ RE-OPEN POLL' : '↓ END POLL & REVEAL WINNER'}
          </button>
        </div>

        {/* Share URL */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.35)', marginBottom: '10px' }}>INVITE THE SQUAD</p>
          <div style={{ border: '2px solid rgba(0,0,0,0.15)', padding: '10px 14px', fontSize: '10px', color: 'rgba(0,0,0,0.4)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {typeof window !== 'undefined' ? window.location.href : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
