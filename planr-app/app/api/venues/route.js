import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const neighborhood = searchParams.get('neighborhood');
  const activity_type = searchParams.get('activity_type');
  const energy_tag = searchParams.get('energy_tag');

  if (!neighborhood || !activity_type || !energy_tag) {
    return NextResponse.json({ venues: [], error: 'Missing parameters' }, { status: 400 });
  }

  // Primary: exact 3-filter match
  const { data: exact, error } = await supabase
    .from('venues')
    .select('*')
    .eq('neighborhood', neighborhood)
    .eq('activity_type', activity_type)
    .eq('energy_tag', energy_tag);

  if (error) {
    return NextResponse.json({ venues: [], error: error.message }, { status: 500 });
  }

  if (exact.length > 0) {
    return NextResponse.json({ venues: exact, fuzzy: false });
  }

  // Fuzzy fallback: drop energy_tag, keep neighborhood + activity_type
  const { data: fallback, error: fallbackError } = await supabase
    .from('venues')
    .select('*')
    .eq('neighborhood', neighborhood)
    .eq('activity_type', activity_type);

  if (fallbackError) {
    return NextResponse.json({ venues: [], error: fallbackError.message }, { status: 500 });
  }

  const availableEnergies = [...new Set(fallback.map(v => v.energy_tag).filter(Boolean))];

  return NextResponse.json({
    venues: fallback,
    fuzzy: true,
    requestedEnergy: energy_tag,
    availableEnergies,
  });
}
