// lib/cron/dailyCheck.js
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../email/sender';

const prisma = new PrismaClient();

export async function runDailyChecks() {
  console.log('Running daily checks at', new Date().toISOString());
  
  try {
    // Get all active challenges
    const activeChallenges = await prisma.userChallenge.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: true,
        challenge: true,
        dailyProgress: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Process each active challenge
    for (const userChallenge of activeChallenges) {
      try {
        // Check if the end date has passed
        const endDate = new Date(userChallenge.endDate);
        if (endDate < today) {
          // Challenge has ended, determine if completed or failed
          await processChallengeCompletion(userChallenge);
          continue;
        }
        
        // Check if user has practiced today
        const hasPracticedToday = userChallenge.dailyProgress.some(progress => {
          const progressDate = new Date(progress.date);
          progressDate.setHours(0, 0, 0, 0);
          return progressDate.getTime() === today.getTime() && progress.completed;
        });
        
        if (!hasPracticedToday) {
          // Send reminder notification
          await sendPracticeReminder(userChallenge);
        }
        
        // Check streak - if zero and challenge requires streaks, issue warning
        if (userChallenge.currentStreak === 0 && userChallenge.challenge.isHardcore) {
          await sendStreakWarning(userChallenge);
        }
      } catch (error) {
        console.error(`Error processing challenge ${userChallenge.id}:`, error);
      }
    }
    
    console.log('Daily checks completed');
  } catch (error) {
    console.error('Error running daily checks:', error);
  }
}

async function processChallengeCompletion(userChallenge) {
  // Calculate completion percentage
  const totalDays = userChallenge.challenge.durationDays;
  const completedDays = await prisma.dailyProgress.count({
    where: {
      userChallengeId: userChallenge.id,
      completed: true
    }
  });
  
  const completionPercentage = (completedDays / totalDays) * 100;
  
  // Update progress percentage
  await prisma.userChallenge.update({
    where: { id: userChallenge.id },
    data: { progressPercentage: completionPercentage }
  });
  
  // Check if challenge is successful
  // For simplicity, we'll say a challenge is complete if the user has completed at least 80% of the days
  const completionThreshold = Math.floor(totalDays * 0.8);
  
  if (completedDays >= completionThreshold) {
    // Mark challenge as completed
    await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: 'COMPLETED' }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: userChallenge.userId,
        type: 'CHALLENGE_COMPLETED',
        title: 'Challenge Completed!',
        message: `Congratulations! You've completed the "${userChallenge.challenge.title}" challenge. Claim your rewards now.`,
        read: false
      }
    });
    
    // Send email notification
    await sendEmail(
      userChallenge.user.email,
      'Challenge Completed!',
      `Congratulations! You've completed the "${userChallenge.challenge.title}" challenge. Claim your rewards now.`
    );
  } else if (userChallenge.challenge.isHardcore) {
    // For hardcore challenges, mark as failed if completion < threshold
    await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: 'FAILED' }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: userChallenge.userId,
        type: 'CHALLENGE_FAILED',
        title: 'Challenge Failed',
        message: `Unfortunately, you didn't meet the requirements for the "${userChallenge.challenge.title}" challenge. Your stake has been forfeited.`,
        read: false
      }
    });
  } else {
    // For no-loss challenges, just mark as completed with partial success
    await prisma.userChallenge.update({
      where: { id: userChallenge.id },
      data: { status: 'COMPLETED' }
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: userChallenge.userId,
        type: 'CHALLENGE_COMPLETED',
        title: 'Challenge Completed',
        message: `Your "${userChallenge.challenge.title}" challenge has ended. You completed ${completedDays} out of ${totalDays} days. Claim your stake now.`,
        read: false
      }
    });
  }
}

async function sendPracticeReminder(userChallenge) {
  // Create reminder notification
  await prisma.notification.create({
    data: {
      userId: userChallenge.userId,
      type: 'CHALLENGE_REMINDER',
      title: 'Daily Practice Reminder',
      message: `Don't forget to practice ${userChallenge.challenge.dailyRequirement} minutes of ${getLanguageName(userChallenge.challenge.languageCode)} today to maintain your streak!`,
      read: false
    }
  });
  
  // Optionally send email if user has email notifications enabled
  if (userChallenge.user.email) {
    await sendEmail(
      userChallenge.user.email,
      'Daily Practice Reminder',
      `Don't forget to practice ${userChallenge.challenge.dailyRequirement} minutes of ${getLanguageName(userChallenge.challenge.languageCode)} today to maintain your streak!`
    );
  }
}

async function sendStreakWarning(userChallenge) {
  // Create streak warning notification
  await prisma.notification.create({
    data: {
      userId: userChallenge.userId,
      type: 'STREAK_WARNING',
      title: 'Streak Warning',
      message: `Your streak for the "${userChallenge.challenge.title}" challenge is at risk! Practice today to avoid losing your stake.`,
      read: false
    }
  });
  
  // Optionally send email if user has email notifications enabled
  if (userChallenge.user.email) {
    await sendEmail(
      userChallenge.user.email,
      'Streak Warning',
      `Your streak for the "${userChallenge.challenge.title}" challenge is at risk! Practice today to avoid losing your stake.`
    );
  }
}

// Helper function to get language name
function getLanguageName(code) {
  const languages = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ru': 'Russian',
    'pt': 'Portuguese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languages[code] || code;
}