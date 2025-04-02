// File: lib/auth/verify.js
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function verifyAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return { success: false, error: 'No authentication token' };
    }
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    if (!payload.userId || !payload.walletAddress) {
      return { success: false, error: 'Invalid token payload' };
    }
    
    return {
      success: true,
      userId: payload.userId,
      walletAddress: payload.walletAddress
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}