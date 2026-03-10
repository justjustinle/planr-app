"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PollPage({ params }) {
  const [poll, setPoll] = useState(null);
  const pollId = params.id;

  useEffect(() => {
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

  const vote = async (optionId) => {
    if (poll?.is_closed) return;
    const currentVotes = poll.votes || {};
    const updatedVotes = { ...currentVotes, [optionId]: (currentVotes[optionId] || 0) + 1 };
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
  };

  const toggleClose = async () => {
    const newState = !poll?.is_closed;
    await supabase.from('polls').update({ is_closed: newState }).eq('id', pollId);
  };

  if (!poll) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: 'bold', fontFamily: 'sans-serif' }}>Loading Poll...</div>;

  const voteEntries = Object.entries(poll.votes || {});
  const maxVotes = voteEntries.length > 0 ? Math.max(...voteEntries.map(e => e[1])) : 0;
  const leaderId = maxVotes > 0 ? voteEntries.find(e => e[1] === maxVotes)?.[0] : null;
  const winner = poll.restaurants?.find(r => r.id === leaderId);

  return (
    <div style={{ backgroundColor: '#FFFDF9', minHeight: '100vh', fontFamily: 'sans-serif', color: '#2D2926', paddingBottom: '120px' }}>

      {/* Header */}
      <header style={{ textAlign: 'center', padding: '60px 20px 20px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: '900', fontStyle: 'italic', color: '#6366f1', letterSpacing: '-2px', margin: 0 }}>PLANR.</h1>
        <div style={{ display: 'inline-block', marginTop: '10px', backgroundColor: '#EEF2FF', color: '#6366f1', fontSize: '10px', fontWeight: '900', padding: '5px 15px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {poll.is_closed ? 'Voting Closed' : 'Live Voting Room'}
        </div>
      </header>

      {/* Winner Banner */}
      {poll.is_closed && winner && (
        <div style={{ maxWidth: '500px', margin: '20px auto', padding: '0 20px' }}>
          <div style={{ backgroundColor: '#6366f1', color: '#FFF', padding: '40px 20px', borderRadius: '35px', textAlign: 'center', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}>
            <span style={{ fontSize: '40px' }}>🎊</span>
            <h2 style={{ fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', margin: '10px 0 5px' }}>The Verdict</h2>
            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>{winner.name}</h1>
          </div>
        </div>
      )}

      {/* Restaurant Options */}
      <div style={{ maxWidth: '500px', margin: '40px auto 0', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {poll.restaurants?.map((opt) => {
          const votes = poll.votes?.[opt.id] || 0;
          const isWinning = votes > 0 && votes === maxVotes;

          return (
            <div
              key={opt.id}
              style={{ position: 'relative', height: '280px', borderRadius: '35px', overflow: 'hidden', border: isWinning ? '5px solid #6366f1' : '2px solid #EEE', transition: '0.3s' }}
            >
              <img src={opt.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />

              <div style={{ position: 'absolute', bottom: '25px', left: '25px', right: '110px', color: '#FFF' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>{opt.name}</h3>
                <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>{opt.rating} ★ • {opt.price || '$$'}</p>
              </div>

              {/* Vote Button Overlay */}
              <button
                onClick={() => vote(opt.id)}
                disabled={poll.is_closed}
                style={{ position: 'absolute', bottom: '25px', right: '25px', width: '80px', height: '60px', borderRadius: '20px', backgroundColor: poll.is_closed ? '#F3F4F6' : (isWinning ? '#6366f1' : '#FFF'), border: 'none', cursor: poll.is_closed ? 'default' : 'pointer', display: 'flex', flexDirection: 'column