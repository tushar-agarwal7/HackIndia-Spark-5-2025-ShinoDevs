// app/api/challenges/complete/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
import { useStaking } from '@/lib/web3/hooks/useStaking';

const prisma = new PrismaClient();

export async function POST(request) {
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userChallengeId } = body;
    
    if (!userChallengeId) {
      return NextResponse.json({ error: 'userChallengeId is required' }, { status: 400 });
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

    // Calculate completion percentage
    const totalDays = userChallenge.challenge.durationDays;
    const completedDays = await prisma.dailyProgress.count({
      where: {
        userChallengeId: userChallengeId,
        completed: true
      }
    });
    
    const progressPercentage = Math.floor((completedDays / totalDays) * 100);

    // Check minimum completion requirement (80%)
    if (progressPercentage < 80) {
      return NextResponse.json({ 
        error: 'Challenge has not met the minimum 80% completion requirement yet' 
      }, { status: 400 });
    }

    // Calculate reward based on stake and yield percentage
    const stake = userChallenge.stakedAmount;
    const yieldPercentage = userChallenge.challenge.yieldPercentage;
    const yieldAmount = (stake * yieldPercentage) / 100;
    const totalReward = stake + yieldAmount;

    // Process blockchain rewards (if needed)
    let transactionHash = null;
    // TODO: Implement actual blockchain rewards claim
    // For now, we'll simulate a successful transaction
    transactionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    // Mark challenge as completed
    const completedChallenge = await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        status: 'COMPLETED',
        completionTxHash: transactionHash,
        progressPercentage: progressPercentage
      }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: auth.userId,
        transactionType: 'REWARD',
        amount: totalReward,
        currency: 'USDC',
        txHash: transactionHash,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create notification for completion
    await prisma.notification.create({
      data: {
        userId: auth.userId,
        type: 'CHALLENGE_COMPLETED',
        title: 'Challenge Completed!',
        message: `Congratulations! You've completed the "${userChallenge.challenge.title}" challenge and earned ${totalReward} USDC.`,
        read: false
      }
    });

    // Check for achievements to award
    await checkAndAwardAchievements(auth.userId, userChallenge);

    // Return completion data
    return NextResponse.json({
      success: true,
      message: 'Challenge successfully completed',
      reward: totalReward,
      transactionHash: transactionHash,
      challenge: completedChallenge
    });
    
  } catch (error) {
    console.error('Error completing challenge:', error);
    return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 });
  }
}

// Helper function to check and award achievements
async function checkAndAwardAchievements(userId, userChallenge) {
  try {
    // Check for CHALLENGE_COMPLETED achievement
    const challengeCompletedAchievement = await prisma.achievement.findFirst({
      where: {
        achievementType: 'CHALLENGE_COMPLETED',
        threshold: 1 // First completed challenge
      }
    });

    if (challengeCompletedAchievement) {
      // Check if user already has this achievement
      const existingAchievement = await prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId: userId,
            achievementId: challengeCompletedAchievement.id
          }
        }
      });

      if (!existingAchievement) {
        // Award the achievement
        await prisma.userAchievement.create({
          data: {
            userId: userId,
            achievementId: challengeCompletedAchievement.id,
            earnedAt: new Date()
          }
        });

        // Create notification for the achievement
        await prisma.notification.create({
          data: {
            userId: userId,
            type: 'ACHIEVEMENT_EARNED',
            title: 'Achievement Unlocked!',
            message: `You've earned the "${challengeCompletedAchievement.name}" achievement.`,
            read: false
          }
        });
      }
    }

    // Check for streak achievements
    if (userChallenge.longestStreak >= 5) {
      const streakAchievement = await prisma.achievement.findFirst({
        where: {
          achievementType: 'STREAK_DAYS',
          threshold: 5 // 5-day streak
        }
      });

      if (streakAchievement) {
        // Check if user already has this achievement
        const existingStreakAchievement = await prisma.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId: userId,
              achievementId: streakAchievement.id
            }
          }
        });

        if (!existingStreakAchievement) {
          // Award the achievement
          await prisma.userAchievement.create({
            data: {
              userId: userId,
              achievementId: streakAchievement.id,
              earnedAt: new Date()
            }
          });

          // Create notification for the achievement
          await prisma.notification.create({
            data: {
              userId: userId,
              type: 'ACHIEVEMENT_EARNED',
              title: 'Achievement Unlocked!',
              message: `You've earned the "${streakAchievement.name}" achievement.`,
              read: false
            }
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
    // Don't fail the entire operation if achievements fail
  }
}