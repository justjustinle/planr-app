import { NextResponse } from 'next/server';

export async function POST(req) {
  const { location, term } = await req.json();
  const apiKey = process.env.YELP_API_KEY;

  const res = await fetch(
    `https://api.yelp.com/v3/businesses/search?location=${location || 'London'}&term=${term}&limit=12&attributes=reservation`,
    {
      headers: { Authorization: `Bearer ${apiKey}` },
    }
  );

  const data = await res.json();
  return NextResponse.json(data.businesses || []);
}