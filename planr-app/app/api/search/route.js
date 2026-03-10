import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { location, term } = await req.json();
    const apiKey = process.env.YELP_API_KEY;

    // Use the searched location or default to London
    const searchLocation = location || 'London';
    // Use the searched term or default to 'restaurants' so it's never empty
    const searchTerm = term || 'restaurants';

    const res = await fetch(
      `https://api.yelp.com/v3/businesses/search?location=${encodeURIComponent(searchLocation)}&term=${encodeURIComponent(searchTerm)}&limit=15`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
      }
    );

    const data = await res.json();

    // If Yelp returns an error (like an expired API key), we catch it here
    if (data.error) {
      console.error("Yelp API Error:", data.error);
      return NextResponse.json({ businesses: [], error: data.error.description }, { status: 400 });
    }

    // This ensures your page.js finds the "businesses" property it is looking for
    return NextResponse.json({ businesses: data.businesses || [] });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ businesses: [], error: "Internal Server Error" }, { status: 500 });
  }
}