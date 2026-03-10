import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    // 1. Get the data from the frontend (the selected restaurants)
    const { restaurants } = await req.json();

    const initialVotes = {};
    restaurants.forEach(opt => {
      initialVotes[opt.id] = 0;
    });

    // 2. Insert using the correct column names ('restaurants' instead of 'options')
    const { data, error } = await supabase
      .from('polls')
      .insert([
        {
          restaurants: restaurants, // Match your Supabase column name!
          votes: initialVotes
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data[0].id });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}