// app/api/auth/logout/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  // Clear the auth token cookie
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  
  return NextResponse.json({ success: true });
}