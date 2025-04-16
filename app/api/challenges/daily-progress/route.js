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
    const { userChallengeId, minutesPracticed, activityType } = body;
    
    if (!userChallengeId || typeof minutesPracticed !== 'number' || minutesPracticed < 0) {
      return NextResponse.json({ 
        error: 'Valid userChallengeId and minutesPracticed are required' 
      }, { status: 400 });
    }

    // Verify the user challenge belongs to the authenticated user
    const userChallenge = await prisma.userChallenge.findUnique({
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
      return NextResponse.json({ error: 'Active user challenge not found' }, { status: 404 });
    }

    // Get today's date (midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's progress
    let dailyProgress = await prisma.dailyProgress.findFirst({
      where: {
        userChallengeId: userChallengeId,
        date: {
          gte: today
        }
      }
    });

    if (!dailyProgress) {
      dailyProgress = await prisma.dailyProgress.create({
        data: {
          userChallengeId: userChallengeId,
          date: today,
          minutesPracticed: 0,
          completed: false
        }
      });
    }

    // Update minutes practiced
    const updatedMinutes = dailyProgress.minutesPracticed + minutesPracticed;
    const isCompleted = updatedMinutes >= userChallenge.challenge.dailyRequirement;
    
    // Update daily progress
    dailyProgress = await prisma.dailyProgress.update({
      where: { id: dailyProgress.id },
      data: {
        minutesPracticed: updatedMinutes,
        completed: isCompleted
      }
    });

    // If completed for the first time today
    if (isCompleted && !dailyProgress.completed) {
      // Get yesterday's date
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if user practiced yesterday
      const yesterdayProgress = await prisma.dailyProgress.findFirst({
        where: {
          userChallengeId: userChallengeId,
          date: {
            gte: yesterday,
            lt: today
          },
          completed: true
        }
      });

      // Update streak based on yesterday's practice
      let newStreak = 1; // Start with 1 for today
      
      if (yesterdayProgress) {
        // Continue streak
        newStreak = userChallenge.currentStreak + 1;
      } else {
        // Reset streak
        newStreak = 1;
      }

      // Update user challenge with new streak
      await prisma.userChallenge.update({
        where: { id: userChallengeId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, userChallenge.longestStreak)
        }
      });

      // Create notification for daily goal completion
      await prisma.notification.create({
        data: {
          userId: auth.userId,
          type: 'CHALLENGE_REMINDER',
          title: 'Daily Goal Completed!',
          message: `You've completed your daily practice goal for "${userChallenge.challenge.title}". Great job!`,
          read: false
        }
      });
    }

    // Calculate overall progress percentage
    const totalDays = userChallenge.challenge.durationDays;
    const completedDays = await prisma.dailyProgress.count({
      where: {
        userChallengeId: userChallengeId,
        completed: true
      }
    });
    
    const progressPercentage = Math.floor((completedDays / totalDays) * 100);

    // Update overall progress percentage
    await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        progressPercentage: progressPercentage
      }
    });

    // Create tracking record based on activity type
    if (activityType) {
      switch (activityType) {
        case 'VOCABULARY':
          await prisma.vocabularyPractice.create({
            data: {
              userId: auth.userId,
              languageCode: userChallenge.challenge.languageCode,
              proficiencyLevel: userChallenge.challenge.proficiencyLevel,
              score: minutesPracticed * 10, // Example scoring mechanism
              totalQuestions: minutesPracticed * 5, // Example
              percentageCorrect: 80, // Example
              userChallengeId: userChallengeId,
              completedAt: new Date()
            }
          });
          break;
          
        case 'GRAMMAR':
          await prisma.grammarPractice.create({
            data: {
              userId: auth.userId,
              languageCode: userChallenge.challenge.languageCode,
              proficiencyLevel: userChallenge.challenge.proficiencyLevel,
              score: minutesPracticed * 8, // Example scoring mechanism
              totalQuestions: minutesPracticed * 4, // Example
              percentageCorrect: 75, // Example
              userChallengeId: userChallengeId,
              completedAt: new Date()
            }
          });
          break;
          
        case 'SPEAKING':
          await prisma.speakingPractice.create({
            data: {
              userId: auth.userId,
              languageCode: userChallenge.challenge.languageCode,
              proficiencyLevel: userChallenge.challenge.proficiencyLevel,
              pronunciationScore: 70, // Example score
              fluencyScore: 65, // Example score
              accuracyScore: 75, // Example score
              overallScore: 70, // Example score
              durationSeconds: minutesPracticed * 60, // Convert minutes to seconds
              userChallengeId: userChallengeId,
              completedAt: new Date()
            }
          });
          break;
      }
    }

    // Return updated progress
    return NextResponse.json({
      success: true,
      dailyProgress: {
        ...dailyProgress,
        dailyRequirement: userChallenge.challenge.dailyRequirement
      },
      progressPercentage,
      completed: isCompleted,
      updatedStreak: newStreak || userChallenge.currentStreak
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}