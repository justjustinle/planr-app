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

    // This makes the page update LIVE when someone else votes!
    const channel = supabase.channel('realtime-votes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'polls', filter: `id=eq.${pollId}` },
      (payload) => setPoll(payload.new))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [pollId]);

  const vote = async (optionId) => {
    const updatedVotes = { ...poll.votes, [optionId]: (poll.votes[optionId] || 0) + 1 };
    await supabase.from('polls').update({ votes: updatedVotes }).eq('id', pollId);
  };

  if (!poll) return <div className="p-10 text-center font-bold">Loading PLANR Poll...</div>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-4xl font-black italic text-indigo-600 mb-8">PLANR.</h1>
      <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Live Vote</p>

      <div className="space-y-4">
        {poll.options.map((opt) => (
          <div key={opt.id} className="border-2 border-black p-5 rounded-2xl flex justify-between items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <h3 className="font-bold text-lg">{opt.name}</h3>
              <p className="text-xs text-gray-500">{opt.location.address1}</p>
            </div>
            <button
              onClick={() => vote(opt.id)}
              className="bg-indigo-600 text-white w-12 h-12 rounded-full font-black text-xl hover:scale-110 transition-transform">
              {poll.votes[opt.id] || 0}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-gray-400 text-xs font-medium">Share this URL with your friends to vote!</p>
    </div>
  );
}