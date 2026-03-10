import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// This connects to your database using the keys from your .env.local file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { options } = await req.json();

    // 1. Prepare the data to be saved
    // We create a 'votes' object where every venue starts at 0 votes
    const initialVotes = {};
    options.forEach(opt => {
      initialVotes[opt.id] = 0;
    });

    // 2. Insert the poll into the Supabase 'polls' table
    const { data, error } = await supabase
      .from('polls')
      .insert([
        {
          options: options,
          votes: initialVotes
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 3. Send back the ID of the new poll so the app can redirect to it
    return NextResponse.json({ id: data[0].id });

  } catch (err) {
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}