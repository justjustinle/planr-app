"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const ORDINAL = ['', '1ST', '2ND', '3RD', '4TH', '5TH'];
const VOTE_WINDOW_MS = 10 * 60 * 1000;

// Vote tallies live in the votes jsonb alongside a reserved __meta key
// (started_at). Strip it before any counting or sorting.
const tallies = (votes) => {
  const t = { ...(votes || {}) };
  delete t.__meta;
  return t;
};

// Sort venues by votes desc; tie-break alphabetically by name
function sortedByVotes(restaurants, votes) {
  return [...(restaurants || [])].sort((a, b) => {
    const diff = (votes[b.name] || 0) - (votes[a.name] || 0);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

function BookingAction({ action }) {
  if (!action) return null;
  const trimmed = action.trim();
  const isWalkIn = trimmed.toUpperCase() === 'WALK IN ONLY';
  const isUrl = trimmed.startsWith('http');
  const style = { ...META, fontSize: '0.65rem', color: 'rgba(255,255,255,0.75)', marginTop: '14px', display: 'block' };

  if (isWalkIn) return <span style={style}>This venue is walk in only</span>;
  if (isUrl) return (
    <a href={trimmed} target="_blank" rel="noopener noreferrer" style={{
      display: 'inline-block', marginTop: '16px', backgroundColor: '#F8E98A', color: '#0A0A0A',
      ...META, fontSize: '0.7rem', padding: '10px 24px', border: '2px solid #F8E98A',
      textDecoration: 'none', boxShadow: '3px 3px 0 rgba(255,255,255,0.15)',
    }}>BOOK NOW →</a>
  );
  const digits = trimmed.replace(/\s/g, '');
  return <span style={style}>Please call: <a href={`tel:${digits}`} style={{ color: '#F8E98A', textDecoration: 'none' }}>{trimmed}</a></span>;
}

function LinkButtons({ venue }) {
  if (!venue.menu_url && !venue.google_maps) return null;
  const btnStyle = {
    ...META, fontSize: '0.55rem', fontWeight: 700,
    color: '#0A0A0A', backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '4px 10px', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.15)',
  };
  return (
    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
      {venue.menu_url && <a href={venue.menu_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={btnStyle}>{venue.cuisine_type ? 'MENU' : 'WEBSITE'}</a>}
      {venue.google_maps && <a href={venue.google_maps} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={btnStyle}>MAPS</a>}
    </div>
  );
}

export default function PollPage({ params }) {
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [myVotes, setMyVotes] = useState([]);
  const [voting, setVoting] = useState(new Set());
  const [timeLeft, setTimeLeft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [online, setOnline] = useState(1);
  const [isHost, setIsHost] = useState(false);
  const [verdictCopied, setVerdictCopied] = useState(false);
  const channelRef = useRef(null);
  const pollId = params.id;

  useEffect(() => {
    const stored = localStorage.getItem(`index_votes_${pollId}`);
    if (stored) setMyVotes(JSON.parse(stored));
    setIsHost(localStorage.getItem(`poll_creator_${pollId}`) === 'true');

    async function getInitialPoll() {
      const { data } = await supabase.from('polls').select('*').eq('id', pollId).single();
      if (data) setPoll(data);
    }
    getInitialPoll();

    const channel = supabase.channel(`poll-${pollId}`, {
      config: { presence: { key: `guest-${Math.random().toString(36).slice(2, 9)}` } },
    });
    channelRef.current = channel;

    channel
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls', filter: `id=eq.${pollId}` },
        (payload) => setPoll(payload.new)
      )
      .on('presence', { event: 'sync' }, () => {
        setOnline(Math.max(1, Object.keys(channelRef.current.presenceState()).length));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track({ joined_at: Date.now() });
      });

    return () => { supabase.removeChannel(channel); };
  }, [pollId]);

  const startedAt = poll?.votes?.__meta?.started_at || null;
  const phase = !poll ? 'loading' : poll.is_closed ? 'results' : startedAt ? 'voting' : 'lobby';

  // Countdown: 10 min from when the host starts the vote; auto-close on expiry
  useEffect(() => {
    if (phase !== 'voting') { setTimeLeft(null); return; }
    const endsAt = new Date(startedAt).getTime() + VOTE_WINDOW_MS;
    const tick = () => {
      const rem = endsAt - Date.now();
      if (rem <= 0) {
        setTimeLeft(0);
        supabase.from('polls').update({ is_closed: true }).eq('id', pollId);
      } else {
        setTimeLeft(rem);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, startedAt, pollId]);

  const startVote = async () => {
    const { data: fresh } = await supabase.from('polls').select('votes').eq('id', pollId).single();
    const votes = fresh?.votes || {};
    await supabase.from('polls').update({
      votes: { ...votes, __meta: { ...(votes.__meta || {}), started_at: new Date().toISOString() } },
    }).eq('id', pollId);
  };

  const vote = async (optionName) => {
    if (phase !== 'voting' || voting.has(optionName)) return;
    const alreadyVoted = myVotes.includes(optionName);
    if (!alreadyVoted && myVotes.length >= 3) return;

    setVoting(prev => new Set(prev).add(optionName));
    const { data: fresh } = await supabase.from('polls').select('votes').eq('id', pollId).single();
    const currentVotes = fresh?.votes || {};
    const updatedMyVotes = alreadyVoted ? myVotes.filter(n => n !== optionName) : [...myVotes, optionName];
    const updatedVotes = {
      ...currentVotes,
      [optionName]: alreadyVoted ? Math.max((currentVotes[optionName] || 1) - 1, 0) : (currentVotes[optionName] || 0) + 1,
    };
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
    localStorage.setItem(`index_votes_${pollId}`, JSON.stringify(updatedMyVotes));
    setMyVotes(updatedMyVotes);
    setVoting(prev => { const s = new Set(prev); s.delete(optionName); return s; });
  };

  const endPoll = async () => {
    await supabase.from('polls').update({ is_closed: true }).eq('id', pollId);
  };

  const reopenPoll = async () => {
    // Re-opening restarts the 10-minute clock so it doesn't instantly re-close
    const { data: fresh } = await supabase.from('polls').select('votes').eq('id', pollId).single();
    const votes = fresh?.votes || {};
    await supabase.from('polls').update({
      is_closed: false,
      votes: { ...votes, __meta: { ...(votes.__meta || {}), started_at: new Date().toISOString() } },
    }).eq('id', pollId);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Computed at the millisecond of the click so the minutes are always live
  const getInviteText = () => {
    if (phase === 'voting' && timeLeft !== null) {
      if (timeLeft < 2 * 60 * 1000) {
        return `CRITICAL TIME. 60 seconds to vote: ${shareUrl}`;
      }
      const mins = Math.ceil(timeLeft / 60000);
      return `Quick! We only have ${mins} minute${mins !== 1 ? 's' : ''} left to lock in tonight's plan. Cast your vote here: ${shareUrl}`;
    }
    return `Vote on tonight's spot — the clock is ticking, decision locks in 10 minutes! Choose here: ${shareUrl}`;
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: 'INDEX.', text: getInviteText() }).catch(() => {});
    } else {
      copyInvite();
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(getInviteText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const broadcastVerdict = (venue) => {
    const text = `The Verdict is locked. ${venue.name} wins tonight. See you there: ${venue.google_maps || shareUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      setVerdictCopied(true);
      setTimeout(() => setVerdictCopied(false), 2000);
    });
  };

  const addToCalendar = (venue) => {
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`INDEX. — ${venue.name}`)}&details=${encodeURIComponent(`The squad voted: ${venue.name} tonight.\n${venue.google_maps || shareUrl}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Deadlock recovery: host hand-picks the winner after a zero-vote close
  const pickWinner = async (venueName) => {
    const { data: fresh } = await supabase.from('polls').select('votes').eq('id', pollId).single();
    const freshVotes = fresh?.votes || {};
    await supabase.from('polls').update({
      votes: { ...freshVotes, [venueName]: 1 },
    }).eq('id', pollId);
  };

  if (phase === 'loading') return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8E98A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ ...DISPLAY, fontSize: '3rem', color: '#0A0A0A' }}>LOADING…</p>
    </div>
  );

  const votes = tallies(poll.votes);
  const ranked = sortedByVotes(poll.restaurants, votes);
  const winner = ranked[0];
  const runnerUps = ranked.slice(1, 4);
  const voteValues = Object.values(votes);
  const maxVotes = voteValues.length > 0 ? Math.max(...voteValues) : 0;
  const totalVotes = voteValues.reduce((sum, v) => sum + v, 0);

  const PresenceBadge = () => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '2px solid #0A0A0A', padding: '4px 12px', backgroundColor: '#FFF' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', display: 'inline-block' }} className="animate-pulse" />
      <span style={{ ...META, fontSize: '0.6rem', color: '#0A0A0A' }}>{online} IN THE ROOM</span>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#F8E98A', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: '2px solid #0A0A0A', padding: '32px 20px 20px' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h1
              onClick={() => router.push('/')}
              style={{ ...DISPLAY, fontSize: '5rem', color: '#0A0A0A', margin: 0, cursor: 'pointer' }}
            >INDEX.</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', marginBottom: '8px' }}>
              <div style={{
                border: '2px solid #0A0A0A', padding: '4px 12px', ...META, fontSize: '0.6rem',
                backgroundColor: phase === 'results' ? '#0A0A0A' : 'transparent',
                color: phase === 'results' ? '#F8E98A' : '#0A0A0A',
              }}>
                {phase === 'results' ? 'VOTING CLOSED' : phase === 'voting' ? 'LIVE VOTE' : 'THE LOBBY'}
              </div>
              {phase === 'voting' && timeLeft !== null && (
                <div style={{
                  border: `2px solid ${timeLeft < 60000 ? '#FF3B30' : '#0A0A0A'}`,
                  padding: '6px 16px', ...DISPLAY, fontSize: '1.4rem',
                  backgroundColor: timeLeft < 60000 ? '#FF3B30' : 'transparent',
                  color: timeLeft < 60000 ? '#FFF' : '#0A0A0A',
                }}>
                  {String(Math.floor(timeLeft / 60000)).padStart(2, '0')}:{String(Math.floor((timeLeft % 60000) / 1000)).padStart(2, '0')}
                </div>
              )}
              {phase !== 'results' && <PresenceBadge />}
            </div>
          </div>
          {phase === 'voting' && (
            <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.45)', marginTop: '8px' }}>
              Pick up to 3 · {myVotes.length}/3 voted
            </p>
          )}
        </div>
      </header>

      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '0 20px' }}>

        {/* ══════════════════════════════════════
            LOBBY — rally the squad before the clock starts
        ══════════════════════════════════════ */}
        {phase === 'lobby' && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ ...DISPLAY, fontSize: '4rem', color: '#0A0A0A', textAlign: 'center', margin: '0 0 8px' }}>
              RALLY THE<br />SQUAD.
            </h2>
            <p style={{ ...META, fontSize: '0.65rem', color: 'rgba(0,0,0,0.5)', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.8 }}>
              {poll.restaurants?.length || 0} spots are on the ballot.<br />
              The clock only starts when the host says go.
            </p>

            {/* Share — the primary action in the lobby */}
            <button
              onClick={copyInvite}
              style={{
                width: '100%', backgroundColor: copied ? '#2A5A2A' : '#0A0A0A', color: '#F8E98A',
                border: '2px solid #0A0A0A', padding: '20px', cursor: 'pointer',
                boxShadow: '5px 5px 0 rgba(0,0,0,0.3)', transition: 'none',
              }}
            >
              <span style={{ ...DISPLAY, fontSize: '1.6rem' }}>
                {copied ? '✓ LINK COPIED!' : 'SEND THE LINK →'}
              </span>
            </button>

            <button
              onClick={copyInvite}
              style={{
                width: '100%', marginTop: '12px', border: '2px solid #0A0A0A', padding: '12px 16px',
                backgroundColor: copied ? '#0A0A0A' : '#FFF', cursor: 'pointer', textAlign: 'center',
                transition: 'none',
              }}
            >
              {copied ? (
                <span style={{ ...DISPLAY, fontSize: '0.9rem', color: '#F8E98A' }}>✓ COPIED TO WHATSAPP!</span>
              ) : (
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(0,0,0,0.5)', wordBreak: 'break-all' }}>{shareUrl}</span>
              )}
            </button>

            {/* Ballot preview — builds anticipation without enabling votes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '36px' }}>
              <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', margin: 0 }}>ON THE BALLOT</p>
              {(poll.restaurants || []).map(opt => (
                <div key={opt.name} style={{ border: '2px solid #0A0A0A', backgroundColor: '#FFF', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ ...DISPLAY, fontSize: '1.2rem', color: '#0A0A0A' }}>{opt.name}</span>
                  {opt.price_range && <span style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.7rem', color: 'rgba(0,0,0,0.45)' }}>{opt.price_range}</span>}
                </div>
              ))}
            </div>

            {/* Host start CTA / guest waiting state */}
            {isHost ? (
              <button
                onClick={startVote}
                style={{
                  width: '100%', marginTop: '36px', backgroundColor: '#FFF', color: '#0A0A0A',
                  border: '2px solid #0A0A0A', padding: '20px', cursor: 'pointer',
                  boxShadow: '5px 5px 0 #0A0A0A', transition: 'none',
                }}
              >
                <span style={{ ...DISPLAY, fontSize: '1.6rem' }}>START THE VOTE</span>
                <span style={{ ...META, fontSize: '0.55rem', display: 'block', marginTop: '6px', color: 'rgba(0,0,0,0.45)' }}>10 MINUTES ON THE CLOCK</span>
              </button>
            ) : (
              <p className="animate-pulse" style={{ ...META, fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', textAlign: 'center', marginTop: '36px' }}>
                WAITING FOR THE HOST TO START…
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            DEADLOCK — poll closed with zero votes
        ══════════════════════════════════════ */}
        {phase === 'results' && totalVotes === 0 && (
          <div style={{ marginTop: '32px' }}>
            <div style={{ border: '2px solid #0A0A0A', backgroundColor: '#0A0A0A', padding: '40px 24px', boxShadow: '6px 6px 0 rgba(0,0,0,0.35)', textAlign: 'center' }}>
              <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 12px' }}>DEADLOCK</p>
              <p style={{ ...DISPLAY, fontSize: '3rem', color: '#FF3B30', margin: 0 }}>NO VOTES<br />CAST IN TIME.</p>
            </div>

            {isHost ? (
              <>
                <button
                  onClick={reopenPoll}
                  style={{
                    width: '100%', marginTop: '24px', backgroundColor: '#FFF', color: '#0A0A0A',
                    border: '2px solid #0A0A0A', padding: '18px', cursor: 'pointer',
                    boxShadow: '5px 5px 0 #0A0A0A', transition: 'none',
                  }}
                >
                  <span style={{ ...DISPLAY, fontSize: '1.4rem' }}>EXTEND THE VOTE</span>
                  <span style={{ ...META, fontSize: '0.55rem', display: 'block', marginTop: '6px', color: 'rgba(0,0,0,0.45)' }}>10 MORE MINUTES ON THE CLOCK</span>
                </button>

                <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', margin: '32px 0 12px' }}>OR CALL IT YOURSELF</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(poll.restaurants || []).map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => pickWinner(opt.name)}
                      style={{
                        border: '2px solid #0A0A0A', backgroundColor: '#FFF', padding: '14px 16px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                        cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'none',
                      }}
                    >
                      <span style={{ ...DISPLAY, fontSize: '1.2rem', color: '#0A0A0A' }}>{opt.name}</span>
                      <span style={{ ...META, fontSize: '0.55rem', color: 'rgba(0,0,0,0.45)' }}>PICK →</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <p className="animate-pulse" style={{ ...META, fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', textAlign: 'center', marginTop: '32px' }}>
                WAITING FOR THE HOST TO BREAK THE DEADLOCK…
              </p>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            POST-VOTE RESULTS VIEW
        ══════════════════════════════════════ */}
        {phase === 'results' && totalVotes > 0 && winner && (
          <>
            {/* THE VERDICT */}
            <div style={{ margin: '32px 0 24px', backgroundColor: '#0A0A0A', border: '2px solid #0A0A0A', boxShadow: '6px 6px 0 rgba(0,0,0,0.35)', overflow: 'hidden' }}>
              {winner.hero_image && (
                <div style={{ position: 'relative', height: '220px' }}>
                  <img src={winner.hero_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: '#F8E98A', border: '2px solid #0A0A0A', padding: '4px 12px', ...META, fontSize: '0.55rem', color: '#0A0A0A' }}>
                    THE VERDICT
                  </div>
                </div>
              )}
              <div style={{ padding: '24px' }}>
                {!winner.hero_image && (
                  <p style={{ ...META, fontSize: '0.55rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 10px' }}>THE VERDICT</p>
                )}
                <p style={{ ...DISPLAY, fontSize: '3rem', color: '#F8E98A', margin: 0, lineHeight: 0.88 }}>{winner.name}</p>
                {winner.price_range && (
                  <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '6px' }}>{winner.price_range}</p>
                )}
                {winner.pro_tip && (
                  <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginTop: '8px', lineHeight: 1.4 }}>{winner.pro_tip}</p>
                )}
                <BookingAction action={winner.booking_action} />
                <LinkButtons venue={winner} />
              </div>
            </div>

            {/* POST-VERDICT UTILITY DOCK */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={() => broadcastVerdict(winner)}
                style={{
                  flex: 1, border: '2px solid #0A0A0A', padding: '16px 10px', cursor: 'pointer',
                  backgroundColor: verdictCopied ? '#0A0A0A' : '#FFF',
                  boxShadow: '4px 4px 0 #0A0A0A', transition: 'none',
                }}
              >
                <span style={{ ...DISPLAY, fontSize: '0.95rem', color: verdictCopied ? '#F8E98A' : '#0A0A0A' }}>
                  {verdictCopied ? '✓ COPIED!' : 'BROADCAST TO SQUAD'}
                </span>
              </button>
              <button
                onClick={() => addToCalendar(winner)}
                style={{
                  flex: 1, border: '2px solid #0A0A0A', padding: '16px 10px', cursor: 'pointer',
                  backgroundColor: '#FFF', boxShadow: '4px 4px 0 #0A0A0A', transition: 'none',
                }}
              >
                <span style={{ ...DISPLAY, fontSize: '0.95rem', color: '#0A0A0A' }}>ADD TO CALENDAR</span>
              </button>
            </div>

            {/* RUNNER-UP LEADERBOARD */}
            {runnerUps.length > 0 && (
              <>
                <p style={{ ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', margin: '0 0 14px' }}>RUNNERS UP</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                  {runnerUps.map((opt, i) => {
                    const rank = i + 2;
                    const optVotes = votes[opt.name] || 0;
                    return (
                      <div key={opt.name} style={{ position: 'relative', height: '200px', overflow: 'hidden', border: '2px solid #0A0A0A', backgroundColor: '#1A1A1A' }}>
                        {opt.hero_image ? (
                          <>
                            <img src={opt.hero_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }} />
                          </>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <p style={{ ...DISPLAY, fontSize: '1.6rem', color: '#FFF', textAlign: 'center', padding: '0 16px' }}>{opt.name}</p>
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '110px', color: '#FFF' }}>
                          <p style={{ ...DISPLAY, fontSize: '1.3rem', margin: 0 }}>{opt.name}</p>
                          {opt.price_range && <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.65rem', opacity: 0.7, margin: '2px 0 0' }}>{opt.price_range}</p>}
                        </div>
                        <div style={{ position: 'absolute', bottom: '14px', right: '14px', display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end' }}>
                          <div style={{ backgroundColor: '#FFF', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.6rem', color: '#0A0A0A' }}>
                            {ORDINAL[rank]}
                          </div>
                          <div style={{ backgroundColor: '#0A0A0A', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.6rem', color: '#F8E98A' }}>
                            VOTED {optVotes}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {isHost && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <button onClick={reopenPoll} style={{
                  background: 'none', border: '2px dashed rgba(0,0,0,0.25)', padding: '12px 28px',
                  ...META, fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', cursor: 'pointer',
                }}>
                  ↑ RE-OPEN POLL (RESTARTS THE CLOCK)
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            LIVE VOTING SCOREBOARD
        ══════════════════════════════════════ */}
        {phase === 'voting' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '32px' }}>
              {(poll.restaurants || []).map((opt) => {
                const optVotes = votes[opt.name] || 0;
                const isWinning = optVotes > 0 && optVotes === maxVotes;
                const isMyVote = myVotes.includes(opt.name);
                const isMaxed = myVotes.length >= 3 && !isMyVote;
                const isDisabled = isMaxed || voting.has(opt.name);

                return (
                  <div key={opt.name} style={{
                    position: 'relative', overflow: 'hidden', backgroundColor: '#1A1A1A',
                    border: isMyVote ? '5px solid #0A0A0A' : '2px solid #0A0A0A',
                    boxShadow: isMyVote ? 'none' : '5px 5px 0 #0A0A0A',
                    transform: isMyVote ? 'translate(5px,5px)' : 'none',
                    opacity: isMaxed ? 0.5 : 1,
                  }}>
                    <div style={{ height: '280px', position: 'relative' }}>
                      {opt.hero_image ? (
                        <>
                          <img src={opt.hero_image} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
                        </>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p style={{ ...DISPLAY, fontSize: '1.8rem', color: '#FFF', textAlign: 'center', padding: '0 20px' }}>{opt.name}</p>
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '80px', color: '#FFF' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h3 style={{ ...DISPLAY, fontSize: '1.6rem', margin: 0 }}>{opt.name}</h3>
                        {opt.price_range && <span style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.7rem', opacity: 0.75 }}>{opt.price_range}</span>}
                      </div>
                      {opt.pro_tip && (
                        <p style={{ fontFamily: 'Barlow, system-ui, sans-serif', fontSize: '0.72rem', opacity: 0.9, marginTop: '4px', marginBottom: 0, fontStyle: 'italic', lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                          {opt.pro_tip}
                        </p>
                      )}
                      <LinkButtons venue={opt} />
                    </div>

                    <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {isWinning && <div style={{ backgroundColor: '#0A0A0A', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.55rem', color: '#F8E98A' }}>LEADING</div>}
                      {isMyVote && <div style={{ backgroundColor: '#F8E98A', border: '2px solid #0A0A0A', padding: '3px 10px', ...META, fontSize: '0.55rem', color: '#0A0A0A' }}>✓ YOUR PICK</div>}
                    </div>

                    <button onClick={() => !isDisabled && vote(opt.name)} disabled={isDisabled} style={{
                      position: 'absolute', bottom: '20px', right: '16px', width: '52px', height: '52px',
                      backgroundColor: isMyVote ? '#0A0A0A' : 'rgba(255,255,255,0.92)',
                      border: '2px solid #0A0A0A', cursor: isDisabled ? 'default' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
                    }}>
                      <span style={{ ...META, fontSize: '0.45rem', color: isMyVote ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>{isMyVote ? 'VOTED' : 'VOTES'}</span>
                      <span style={{ ...DISPLAY, fontSize: '1.4rem', color: isMyVote ? '#F8E98A' : '#0A0A0A', lineHeight: 1 }}>{optVotes}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {isHost && (
              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button onClick={endPoll} style={{
                  backgroundColor: '#FFF', border: '2px solid #0A0A0A', padding: '12px 28px',
                  ...META, fontWeight: 900, fontSize: '0.6rem', color: '#0A0A0A', cursor: 'pointer',
                  boxShadow: '4px 4px 0 #0A0A0A',
                }}>
                  END POLL & REVEAL WINNER
                </button>
              </div>
            )}
          </>
        )}
        {isHost && (
          <div style={{ textAlign: 'center', marginTop: '48px', paddingTop: '24px', borderTop: '2px solid rgba(0,0,0,0.15)' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                border: '2px solid #0A0A0A', padding: '14px 32px', cursor: 'pointer',
                backgroundColor: '#0A0A0A', transition: 'none',
              }}
            >
              <span style={{ ...DISPLAY, fontSize: '1.2rem', color: '#F8E98A' }}>START AGAIN →</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
