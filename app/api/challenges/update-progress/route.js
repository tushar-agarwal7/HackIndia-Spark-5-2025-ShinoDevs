// app/api/challenges/update-progress/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function POST(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { userChallengeId, minutes, isSessionEnd, conversationId } = body;
    
    if (!userChallengeId || !minutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Verify the user challenge belongs to the authenticated user
    const userChallenge = await prisma.userChallenge.findFirst({
      where: {
        id: userChallengeId,
        userId: auth.userId,
        status: 'ACTIVE'
      },
      include: {
        challenge: true
      }
    });
    
    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found or not active' }, { status: 404 });
    }
    
    // Get today's date (reset to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find or create daily progress record
    let dailyProgress = await prisma.dailyProgress.findUnique({
      where: {
        userChallengeId_date: {
          userChallengeId,
          date: today
        }
      }
    });
    
    if (dailyProgress) {
      // Update existing record
      dailyProgress = await prisma.dailyProgress.update({
        where: { id: dailyProgress.id },
        data: {
          minutesPracticed: dailyProgress.minutesPracticed + minutes,
          completed: (dailyProgress.minutesPracticed + minutes) >= userChallenge.challenge.dailyRequirement
        }
      });
    } else {
      // Create new record
      dailyProgress = await prisma.dailyProgress.create({
        data: {
          userChallengeId,
          date: today,
          minutesPracticed: minutes,
          completed: minutes >= userChallenge.challenge.dailyRequirement
        }
      });
    }
    
    // Update user streak
    await updateUserStreak(userChallengeId);
    
    // Update overall progress percentage
    await updateOverallProgress(userChallengeId);
    
    // If this is the end of a session and we have a conversationId,
    // associate the conversation with this progress
    if (isSessionEnd && conversationId) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: {
          endedAt: new Date(),
          durationMinutes: minutes
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      minutesPracticed: dailyProgress.minutesPracticed,
      completed: dailyProgress.completed
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

// Helper function to update user streak
async function updateUserStreak(userChallengeId) {
  try {
    // Get the user challenge record
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId }
    });
    
    if (!userChallenge) {
      console.error('User challenge not found');
      return;
    }
    
    // Get daily progress records ordered by date descending
    const progressRecords = await prisma.dailyProgress.findMany({
      where: { userChallengeId },
      orderBy: { date: 'desc' },
      select: { date: true, completed: true }
    });
    
    // If no records, streak is 0
    if (progressRecords.length === 0) {
      await prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: { currentStreak: 0 }
      });
      return;
    }
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today's record exists and was completed
    const todayRecord = progressRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime() && record.completed;
    });
    
    if (todayRecord) {
      currentStreak = 1;
      
      // Check previous days
      let prevDate = new Date(today);
      prevDate.setDate(prevDate.getDate() - 1);
      
      let consecutiveDays = true;
      while (consecutiveDays) {
        const prevDayRecord = progressRecords.find(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === prevDate.getTime() && record.completed;
        });
        
        if (prevDayRecord) {
          currentStreak++;
          prevDate.setDate(prevDate.getDate() - 1);
        } else {
          consecutiveDays = false;
        }
      }
    }
    
    // Update current streak
    await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: { 
        currentStreak,
        // Update longest streak if current > longest
        longestStreak: currentStreak > userChallenge.longestStreak 
          ? currentStreak 
          : userChallenge.longestStreak
      }
    });
  } catch (error) {
    console.error('Error updating user streak:', error);
  }
}

// Helper function to update overall progress
async function updateOverallProgress(userChallengeId) {
  try {
    // Get the user challenge and related challenge data
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { 
        challenge: true,
        dailyProgress: true
      }
    });
    
    if (!userChallenge) {
      console.error('User challenge not found');
      return;
    }
    
    // Calculate overall progress percentage
    // Method: (completed days / total challenge days) * 100
    const totalDays = userChallenge.challenge.durationDays;
    const completedDays = userChallenge.dailyProgress.filter(p => p.completed).length;
    
    // Calculate days elapsed since challenge start
    const startDate = new Date(userChallenge.startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include start day
    
    // Calculate expected progress at this point (can't exceed 100%)
    const expectedProgress = Math.min(daysDiff / totalDays, 1);
    
    // Calculate actual progress (can't exceed 100%)
    const actualProgress = Math.min(completedDays / totalDays, 1);
    
    // Calculate overall percentage
    const progressPercentage = Math.round(actualProgress * 100);
    
    // Update user challenge progress
    await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: { progressPercentage }
    });
  } catch (error) {
    console.error('Error updating overall progress:', error);
  }
}