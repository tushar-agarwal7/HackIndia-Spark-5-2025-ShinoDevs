// app/api/challenges/create/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Verify authentication
    const auth = await verifyAuth();
    
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate request body
    const requiredFields = [
      'title', 
      'languageCode', 
      'proficiencyLevel', 
      'durationDays', 
      'dailyRequirement', 
      'stakeAmount'
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Validate numerical fields
    const numericFields = [
      { name: 'durationDays', min: 1, max: 365 },
      { name: 'dailyRequirement', min: 5, max: 120 },
      { name: 'stakeAmount', min: 10, max: 1000 },
      { name: 'yieldPercentage', min: 0, max: 20 }
    ];
    
    for (const field of numericFields) {
      const value = parseFloat(body[field.name]);
      
      if (isNaN(value)) {
        return NextResponse.json({ 
          error: `Invalid value for ${field.name}: must be a number` 
        }, { status: 400 });
      }
      
      if (value < field.min || value > field.max) {
        return NextResponse.json({ 
          error: `${field.name} must be between ${field.min} and ${field.max}` 
        }, { status: 400 });
      }
    }
    
    // Generate a random invite code if this is a private challenge but no code provided
    let inviteCode = body.inviteCode;
    if (body.maxParticipants && !inviteCode) {
      inviteCode = nanoid(8);
    }
    
    // Get current blockchain network (default to 'polygon')
    const contractChain = body.contractChain || 'polygon';
    
    // Create the challenge
    const challenge = await prisma.challenge.create({
      data: {
        title: body.title,
        description: body.description || '',
        languageCode: body.languageCode,
        proficiencyLevel: body.proficiencyLevel,
        durationDays: parseInt(body.durationDays),
        dailyRequirement: parseInt(body.dailyRequirement),
        stakeAmount: parseFloat(body.stakeAmount),
        yieldPercentage: parseFloat(body.yieldPercentage || 5),
        isHardcore: Boolean(body.isHardcore),
        maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : null,
        inviteCode: inviteCode,
        creatorId: auth.userId,
        isActive: true,
        
        // Add blockchain-related fields if provided
        contractAddress: body.contractAddress || null,
        contractChain: contractChain
      }
    });
    
    // If blockchain transaction information is provided, create a transaction record
    if (body.transactionHash) {
      await prisma.transaction.create({
        data: {
          userId: auth.userId,
          transactionType: 'STAKE',
          amount: 0, // No amount for registration
          currency: contractChain === 'polygon' || contractChain === 'mumbai' ? 'MATIC' : 'ETH', // Gas fee currency
          txHash: body.transactionHash,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }
    
    // Automatically join the creator to their own challenge if specified
    if (body.autoJoin) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(body.durationDays));
      
      await prisma.userChallenge.create({
        data: {
          userId: auth.userId,
          challengeId: challenge.id,
          startDate: startDate,
          endDate: endDate,
          stakedAmount: parseFloat(body.stakeAmount),
          currentStreak: 0,
          longestStreak: 0,
          progressPercentage: 0,
          status: 'ACTIVE',
          stakeTxHash: body.stakeTxHash || null
        }
      });
    }
    
    // Create notification for successful challenge creation
    await prisma.notification.create({
      data: {
        userId: auth.userId,
        type: 'CHALLENGE_CREATED',
        title: 'Challenge Created',
        message: `You've successfully created the "${challenge.title}" challenge.`,
        read: false
      }
    });
    
    return NextResponse.json(challenge, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json({ 
      error: 'Failed to create challenge', 
      details: error.message 
    }, { status: 500 });
  }
}