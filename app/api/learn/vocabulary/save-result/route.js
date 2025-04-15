// app/api/learn/vocabulary/save-result/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';
const prisma = new PrismaClient();

export async function POST(request) {
  // Verify authentication
  const auth = await verifyAuth();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { languageCode, proficiencyLevel, score, totalQuestions, userChallengeId } = body;
    
    // Validate required fields
    if (!languageCode || score === undefined || !totalQuestions) {
      return NextResponse.json({
        error: 'Language code, score, and total questions are required'
      }, { status: 400 });
    }
    
    // Calculate percentage score
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Save practice result
    const practiceResult = await prisma.vocabularyPractice.create({
      data: {
        userId: auth.userId,
        languageCode,
        proficiencyLevel: proficiencyLevel || 'BEGINNER',
        score,
        totalQuestions,
        percentageCorrect: percentage,
        userChallengeId: userChallengeId || null,
        completedAt: new Date()
      }
    });
    
    // Update user's vocabulary size estimate based on performance
    await updateVocabularySize(auth.userId, languageCode, proficiencyLevel, percentage);
    
    // Check if user earned any achievements
    await checkForAchievements(auth.userId, languageCode);
    
    return NextResponse.json({
      success: true,
      practiceId: practiceResult.id,
      percentage
    });
  } catch (error) {
    console.error('Error saving vocabulary practice result:', error);
    return NextResponse.json({
      error: 'Failed to save practice result'
    }, { status: 500 });
  }
}

// Helper function to update user's vocabulary size estimate
async function updateVocabularySize(userId, languageCode, proficiencyLevel, percentageCorrect) {
  try {
    // Get the latest progress record for this language
    const latestRecord = await prisma.progressRecord.findFirst({
      where: {
        userId,
        languageCode
      },
      orderBy: {
        recordDate: 'desc'
      }
    });
    
    // Base vocabulary size based on proficiency level
    const baseVocabSize = {
      'BEGINNER': 500,
      'ELEMENTARY': 1500,
      'INTERMEDIATE': 3000,
      'ADVANCED': 6000,
      'FLUENT': 10000
    }[proficiencyLevel] || 500;
    
    // Current vocabulary size (if record exists) or base size
    const currentSize = latestRecord?.vocabularySize || baseVocabSize;
    
    // Calculate vocabulary size adjustment based on performance
    // Strong performance increases estimated vocabulary size
    let newSize = currentSize;
    if (percentageCorrect >= 90) {
      // Excellent performance - increase by 5-10%
      newSize = Math.round(currentSize * (1 + (0.05 + Math.random() * 0.05)));
    } else if (percentageCorrect >= 70) {
      // Good performance - increase by 2-5%
      newSize = Math.round(currentSize * (1 + (0.02 + Math.random() * 0.03)));
    } else if (percentageCorrect < 50) {
      // Poor performance - slight decrease
      newSize = Math.round(currentSize * 0.98);
    }
    
    // Create new progress record
    await prisma.progressRecord.create({
      data: {
        userId,
        languageCode,
        recordDate: new Date(),
        vocabularySize: newSize,
        // Estimate other metrics based on vocabulary performance
        grammarAccuracy: latestRecord?.grammarAccuracy || percentageCorrect,
        speakingFluency: latestRecord?.speakingFluency || null,
        listeningComprehension: latestRecord?.listeningComprehension || null,
        overallLevel: proficiencyLevel
      }
    });
    
    return newSize;
  } catch (error) {
    console.error('Error updating vocabulary size:', error);
    return null;
  }
}

// Helper function to check for achievements
async function checkForAchievements(userId, languageCode) {
  try {
    // Get count of vocabulary practices for this user and language
    const practiceCount = await prisma.vocabularyPractice.count({
      where: {
        userId,
        languageCode
      }
    });
    
    // Check for vocabulary practice count achievement
    const practiceCountThresholds = [1, 5, 10, 25, 50, 100];
    
    for (const threshold of practiceCountThresholds) {
      if (practiceCount === threshold) {
        // Find the achievement for this threshold
        const achievement = await prisma.achievement.findFirst({
          where: {
            achievementType: 'VOCABULARY_PRACTICE',
            threshold
          }
        });
        
        if (achievement) {
          // Check if user already has this achievement
          const existingAchievement = await prisma.userAchievement.findFirst({
            where: {
              userId,
              achievementId: achievement.id
            }
          });
          
          if (!existingAchievement) {
            // Award the achievement
            await prisma.userAchievement.create({
              data: {
                userId,
                achievementId: achievement.id
              }
            });
            
            // Create notification
            await prisma.notification.create({
              data: {
                userId,
                type: 'ACHIEVEMENT_EARNED',
                title: 'Achievement Unlocked!',
                message: `You've earned the "${achievement.name}" achievement by completing ${threshold} vocabulary practice sessions.`,
                read: false
              }
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for achievements:', error);
  }
}