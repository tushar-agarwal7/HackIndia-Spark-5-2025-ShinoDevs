// File: lib/auth/jwt.js
import { jwtVerify, SignJWT } from 'jose';

// Function to verify JWT
export async function verifyJWT(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Function to create JWT
export async function createJWT(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
  
  return jwt;
}
