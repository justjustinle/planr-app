import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location') || '';
    const category = searchParams.get('term') || 'restaurants';

    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, image_url, rating, price, url')
      .ilike('location', location.trim())
      .eq('category', category)
      .limit(15);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ businesses: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ businesses: data || [] });

  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ businesses: [], error: 'Internal Server Error' }, { status: 500 });
  }
}
