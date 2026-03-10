import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location') || 'London';
    const term = searchParams.get('term') || 'restaurants';

    const apiKey = process.env.YELP_API_KEY;

    const res = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(location)}&term=${encodeURIComponent(term)}&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        // This prevents Next.js from caching old search results
        next: { revalidate: 0 }
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("Yelp API Error:", data.error);
      return NextResponse.json({ businesses: [], error: data.error.description }, { status: 400 });
    }

    return NextResponse.json({ businesses: data.businesses || [] });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ businesses: [], error: "Internal Server Error" }, { status: 500 });
  }
}