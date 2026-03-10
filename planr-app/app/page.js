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

    // Live update subscription
    const channel = supabase.channel(`poll-${pollId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'polls', filter: `id=eq.${pollId}` },
        (payload) => setPoll(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  const vote = async (optionId) => {
    // Optimistically update the UI locally first for speed
    const currentVotes = poll.votes || {};
    const updatedVotes = { ...currentVotes, [optionId]: (currentVotes[optionId] || 0) + 1 };

    // Push to Supabase
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
  };

  if (!poll) return <div className="p-10 text-center font-bold animate-pulse">Loading PLANR Poll...</div>;

  // Logic to find the current leader
  const voteCounts = Object.values(poll.votes || {});
  const maxVotes = Math.max(...voteCounts, 0);

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-50 min-h-screen font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-black italic text-indigo-600 tracking-tighter">PLANR.</h1>
        <div className="mt-2 inline-block bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
          Live Voting Room
        </div>
      </header>

      <div className="space-y-4">
        {poll?.restaurants?.map((opt) => {
          const isWinner = poll.votes?.[opt.id] > 0 && poll.votes?.[opt.id] === maxVotes;

          return (
            <div
              key={opt.id}
              className={`relative border-2 transition-all duration-300 p-4 rounded-2xl flex justify-between items-center bg-white shadow-sm ${isWinner ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-black'}`}
            >
              {isWinner && (
                <div className="absolute -top-3 -left-2 bg-yellow-400 text-sm rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                  👑
                </div>
              )}

              <div className="flex items-center gap-4">
                {opt.image_url && (
                  <img src={opt.image_url} alt={opt.name} className="w-14 h-14 object-cover rounded-xl shadow-inner" />
                )}
                <div className="max-w-[150px]">
                  <h3 className="font-bold text-md leading-tight truncate">{opt.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{opt.rating} ⭐ • {opt.price || '$$'}</p>
                </div>
              </div>

              <button
                onClick={() => vote(opt.id)}
                className={`flex flex-col items-center justify-center min-w-[75px] py-2 px-3 rounded-xl font-bold transition-all active:scale-90 ${isWinner ? 'bg-indigo-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                <span className="text-[10px] uppercase opacity-80">Votes</span>
                <span className="text-xl">{poll.votes?.[opt.id] || 0}</span>
              </button>
            </div>
          );
        })}
      </div>

      <footer className="mt-12 p-6 border-t border-dashed border-gray-300 text-center">
        <p className="text-gray-500 text-sm font-bold mb-2">Invite the squad</p>
        <div className="bg-gray-200 p-3 rounded-lg text-[11px] font-mono break-all text-gray-600">
          {typeof window !== 'undefined' ? window.location.href : ''}
        </div>
        <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Supabase Realtime</p>
      </footer>
    </div>
  );
}