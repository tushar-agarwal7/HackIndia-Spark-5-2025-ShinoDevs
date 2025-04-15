// app/api/learn/grammar/save-result/route.js
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
    const { 
      languageCode, 
      proficiencyLevel, 
      score, 
      totalQuestions, 
      userChallengeId,
      grammarConcepts = [] // Array of grammar concepts practiced
    } = body;
    
    // Validate required fields
    if (!languageCode || score === undefined || !totalQuestions) {
      return NextResponse.json({
        error: 'Language code, score, and total questions are required'
      }, { status: 400 });
    }
    
    // Calculate percentage score
    const percentage = Math.round((score / totalQuestions) * 100);
    
    // Save practice result
    const practiceResult = await prisma.grammarPractice.create({
      data: {
        userId: auth.userId,
        languageCode,
        proficiencyLevel: proficiencyLevel || 'BEGINNER',
        score,
        totalQuestions,
        percentageCorrect: percentage,
        grammarConcepts: grammarConcepts.join(','), // Store concepts as comma-separated string
        userChallengeId: userChallengeId || null,
        completedAt: new Date()
      }
    });
    
    // Update user's grammar accuracy in progress record
    await updateGrammarAccuracy(auth.userId, languageCode, proficiencyLevel, percentage);
    
    // Check for achievements
    await checkForAchievements(auth.userId, languageCode);
    
    return NextResponse.json({
      success: true,
      practiceId: practiceResult.id,
      percentage
    });
  } catch (error) {
    console.error('Error saving grammar practice result:', error);
    return NextResponse.json({
      error: 'Failed to save practice result'
    }, { status: 500 });
  }
}

// Helper function to update user's grammar accuracy
async function updateGrammarAccuracy(userId, languageCode, proficiencyLevel, percentageCorrect) {
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
    
    // Calculate new grammar accuracy
    // If there's an existing record, use weighted average (30% new score, 70% previous)
    let newAccuracy = percentageCorrect;
    if (latestRecord && latestRecord.grammarAccuracy !== null) {
      newAccuracy = Math.round(0.3 * percentageCorrect + 0.7 * latestRecord.grammarAccuracy);
    }
    
    // Create new progress record
    await prisma.progressRecord.create({
      data: {
        userId,
        languageCode,
        recordDate: new Date(),
        grammarAccuracy: newAccuracy,
        vocabularySize: latestRecord?.vocabularySize || null,
        speakingFluency: latestRecord?.speakingFluency || null,
        listeningComprehension: latestRecord?.listeningComprehension || null,
        overallLevel: proficiencyLevel
      }
    });
    
    return newAccuracy;
  } catch (error) {
    console.error('Error updating grammar accuracy:', error);
    return null;
  }
}

// Helper function to check for achievements
async function checkForAchievements(userId, languageCode) {
  try {
    // Get count of grammar practices for this user and language
    const practiceCount = await prisma.grammarPractice.count({
      where: {
        userId,
        languageCode
      }
    });
    
    // Check for grammar practice count achievement
    const practiceCountThresholds = [1, 5, 10, 25, 50, 100];
    
    for (const threshold of practiceCountThresholds) {
      if (practiceCount === threshold) {
        // Find the achievement for this threshold
        const achievement = await prisma.achievement.findFirst({
          where: {
            achievementType: 'GRAMMAR_PRACTICE',
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
                message: `You've earned the "${achievement.name}" achievement by completing ${threshold} grammar practice sessions.`,
                read: false
              }
            });
          }
        }
      }
    }
    
    // Check for grammar mastery achievements (high scores)
    const perfectScores = await prisma.grammarPractice.count({
      where: {
        userId,
        languageCode,
        percentageCorrect: 100 // 100% score
      }
    });
    
    // Achievement thresholds for perfect scores
    const perfectScoreThresholds = [1, 5, 10, 25];
    
    for (const threshold of perfectScoreThresholds) {
      if (perfectScores === threshold) {
        // Find the achievement for perfect scores
        const achievement = await prisma.achievement.findFirst({
          where: {
            achievementType: 'GRAMMAR_MASTERY',
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
                message: `You've earned the "${achievement.name}" achievement by getting perfect scores in ${threshold} grammar practice sessions.`,
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