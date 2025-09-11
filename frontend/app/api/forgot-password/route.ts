import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const response = await fetch(`${apiBase}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch {
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
} 