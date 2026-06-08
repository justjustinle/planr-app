import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const neighborhood = searchParams.get('neighborhood');
    const activity_type = searchParams.get('activity_type');
    const energy_tag = searchParams.get('energy_tag');

    // Primary: exact 3-filter match
    let query = supabase.from('venues').select('*');
    if (neighborhood) query = query.eq('neighborhood', neighborhood);
    if (activity_type) query = query.eq('activity_type', activity_type);
    if (energy_tag) query = query.eq('energy_tag', energy_tag);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ venues: [], error: error.message }, { status: 500 });
    }

    if (data && data.length > 0) {
      return NextResponse.json({ venues: data, fuzzy: false });
    }

    // Fallback: drop energy_tag filter
    let fallbackQuery = supabase.from('venues').select('*');
    if (neighborhood) fallbackQuery = fallbackQuery.eq('neighborhood', neighborhood);
    if (activity_type) fallbackQuery = fallbackQuery.eq('activity_type', activity_type);

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (fallbackError) {
      return NextResponse.json({ venues: [], error: fallbackError.message }, { status: 500 });
    }

    return NextResponse.json({ venues: fallbackData || [], fuzzy: true });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ venues: [], error: 'Internal Server Error' }, { status: 500 });
  }
}
