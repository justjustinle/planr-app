import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Parses a comma-separated query param into a list of trimmed values
const parseList = (raw) => (raw || '').split(',').map(v => v.trim()).filter(Boolean);

// Builds a PostgREST .or() string matching any of the values (case-insensitive).
// energy_tag cells can hold multiple tags ("Squad, Buzzy") so those use contains matching.
const orFilter = (column, values, contains = false) =>
  values.map(v => `${column}.ilike.${contains ? `%${v}%` : v}`).join(',');

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const neighborhoods = parseList(searchParams.get('neighborhood'));
    const activityTypes = parseList(searchParams.get('activity_type'));
    const energyTags = parseList(searchParams.get('energy_tag'));

    if (!neighborhoods.length || !activityTypes.length || !energyTags.length) {
      return NextResponse.json({ venues: [], error: 'Missing parameters' }, { status: 400 });
    }

    // Primary: match any selected neighborhood AND any activity AND any energy
    const { data: exact, error } = await supabase
      .from('databaseindex')
      .select('*')
      .or(orFilter('neighborhood', neighborhoods))
      .or(orFilter('activity_type', activityTypes))
      .or(orFilter('energy_tag', energyTags, true));

    if (error) {
      return NextResponse.json({ venues: [], error: error.message }, { status: 500 });
    }

    if (exact.length > 0) {
      return NextResponse.json({ venues: exact, fuzzy: false });
    }

    // Fuzzy fallback: drop energy tags, keep neighborhoods + activities
    const { data: fallback, error: fallbackError } = await supabase
      .from('databaseindex')
      .select('*')
      .or(orFilter('neighborhood', neighborhoods))
      .or(orFilter('activity_type', activityTypes));

    if (fallbackError) {
      return NextResponse.json({ venues: [], error: fallbackError.message }, { status: 500 });
    }

    const availableEnergies = [...new Set(fallback.map(v => v.energy_tag).filter(Boolean))];

    return NextResponse.json({
      venues: fallback || [],
      fuzzy: true,
      requestedEnergy: energyTags.join(', '),
      availableEnergies,
    });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ venues: [], error: 'Internal Server Error' }, { status: 500 });
  }
}
