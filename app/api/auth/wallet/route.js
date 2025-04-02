// File: app/api/auth/wallet/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

// Generate nonce for signing
export async function GET(request) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('address');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }
    
    // Generate a random nonce
    const nonce = nanoid();
    
    const cookieStore = await cookies();
    // Store nonce in cookies for later verification
    cookieStore.set('auth_nonce', nonce, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 5 * 60, // 5 minutes
      path: '/' 
    });
    
    const message = `Welcome to ShinobiSpeak!\n\nPlease sign this message to verify your wallet ownership.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${walletAddress}\nNonce: ${nonce}`;
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error generating nonce:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify signature and authenticate user
export async function POST(request) {
  try {
    const { walletAddress, signature } = await request.json();
    
    if (!walletAddress || !signature) {
      return NextResponse.json({ error: 'Wallet address and signature are required' }, { status: 400 });
    }
    
    // Get nonce from cookies
    const nonce = await cookies().get('auth_nonce')?.value;
    
    if (!nonce) {
      return NextResponse.json({ error: 'Authentication nonce not found or expired' }, { status: 401 });
    }
    
    // Recreate the message that was signed
    const message = `Welcome to ShinobiSpeak!\n\nPlease sign this message to verify your wallet ownership.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nWallet address: ${walletAddress}\nNonce: ${nonce}`;
    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    
    const isNewUser = !user;
    
    if (!user) {
      // Create new user with just wallet address
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: `user_${walletAddress.slice(0, 6)}`, // Temporary username
        },
      });
    }
    
    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ 
      userId: user.id,
      walletAddress: user.walletAddress 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
    
    // Clear nonce cookie
    const cookieStore= await cookies();
    cookieStore.delete('auth_nonce');
    
    // Set auth token cookie
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        username: user.username,
        isProfileComplete: Boolean(user.username && user.email && user.nativeLanguage),
        isNewUser
      }
    });
  } catch (error) {
    console.error('Error authenticating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}