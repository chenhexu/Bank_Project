import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiBase = process.env.BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/withdraw`, {
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
    console.error('Withdraw API error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
} 