// app/api/challenges/[id]/update-contract/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });
    }
    
    // Parse request body
    const body = await request.json();
    const { transactionHash, contractAddress, contractChain } = body;
    
    if (!transactionHash || !contractAddress) {
      return NextResponse.json({ 
        error: 'Transaction hash and contract address are required' 
      }, { status: 400 });
    }
    
    // Check if challenge exists and user is the creator
    const challenge = await prisma.challenge.findUnique({
      where: { id }
    });
    
    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }
    
    if (challenge.creatorId !== auth.userId) {
      return NextResponse.json({ 
        error: 'Only the challenge creator can update contract details' 
      }, { status: 403 });
    }
    
    // Update the challenge with blockchain details
    const updatedChallenge = await prisma.challenge.update({
      where: { id },
      data: {
        contractAddress,
        contractChain: contractChain || 'polygon', // Default to polygon if not specified
      }
    });
    
    // Create a transaction record for the contract registration
    await prisma.transaction.create({
      data: {
        userId: auth.userId,
        transactionType: 'CONTRACT_REGISTRATION',
        amount: 0, // No amount for registration
        currency: 'MATIC', // Gas fee currency
        txHash: transactionHash,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
    
    return NextResponse.json(updatedChallenge);
  } catch (error) {
    console.error('Error updating challenge contract details:', error);
    return NextResponse.json({ 
      error: 'Failed to update contract details', 
      details: error.message 
    }, { status: 500 });
  }
}