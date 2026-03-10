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

    return () => supabase.removeChannel(channel);
  }, [pollId]);

  const vote = async (optionId) => {
    if (poll.is_closed) return; // Stop votes if poll is closed
    const currentVotes = poll.votes || {};
    const updatedVotes = { ...currentVotes, [optionId]: (currentVotes[optionId] || 0) + 1 };
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
  };

  const toggleClose = async () => {
    const newState = !poll.is_closed;
    await supabase.from('polls').update({ is_closed: newState }).eq('id', pollId);
  };

  if (!poll) return <div className="p-10 text-center font-bold">Loading...</div>;

  // WINNER LOGIC
  const voteCounts = Object.values(poll.votes || {});
  const maxVotes = Math.max(...voteCounts, 0);
  const leaderId = Object.keys(poll.votes || {}).find(key => poll.votes[key] === maxVotes);
  const winner = poll.restaurants.find(r => r.id === leaderId);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <h1 className="text-5xl font-black italic text-indigo-600 tracking-tighter text-center">PLANR.</h1>

      {/* 🎊 WINNER BANNER */}
      {poll.is_closed && winner && (
        <div className="mt-6 bg-indigo-600 text-white p-8 rounded-3xl text-center shadow-xl animate-in fade-in zoom-in duration-500">
          <span className="text-5xl">🎊</span>
          <h2 className="text-xl font-black mt-2 uppercase">The Verdict</h2>
          <h1 className="text-3xl font-black">{winner.name}</h1>
          <p className="mt-2 opacity-80 text-sm font-bold">The people have spoken. Let's go!</p>
        </div>
      )}

      <div className="space-y-4 mt-8">
        {poll.restaurants.map((opt) => {
          const isWinning = poll.votes?.[opt.id] > 0 && poll.votes?.[opt.id] === maxVotes;
          return (
            <div key={opt.id} className={`p-4 rounded-2xl flex justify-between items-center bg-white border-2 shadow-sm transition-all ${isWinning ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-black'}`}>
              <div className="flex items-center gap-3">
                <img src={opt.image_url} className="w-12 h-12 object-cover rounded-lg" alt="" />
                <div>
                  <h3 className="font-bold text-sm">{opt.name}</h3>
                  <p className="text-[10px] text-gray-400">{opt.rating} ⭐</p>
                </div>
              </div>

              <button
                disabled={poll.is_closed}
                onClick={() => vote(opt.id)}
                className={`min-w-[70px] py-2 rounded-xl font-bold flex flex-col items-center ${poll.is_closed ? 'bg-gray-200 text-gray-400' : 'bg-black text-white active:scale-90'}`}
              >
                <span className="text-[9px] uppercase">Votes</span>
                <span className="text-lg">{poll.votes?.[opt.id] || 0}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 🔒 ADMIN TOGGLE */}
      <button
        onClick={toggleClose}
        className="w-full mt-12 py-4 border-2 border-black rounded-2xl font-black uppercase text-xs hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      >
        {poll.is_closed ? "🔓 Re-open Poll" : "🔒 Close Poll & Reveal Winner"}
      </button>
    </div>
  );
}