import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const response = await fetch(`${apiBase}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Transfer API error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
} 