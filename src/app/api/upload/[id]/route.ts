import { NextResponse } from 'next/server';

// Dummy route to force Next.js to register parent /api/upload route
// This is a workaround for Next.js 14.1.0 App Router bug
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
