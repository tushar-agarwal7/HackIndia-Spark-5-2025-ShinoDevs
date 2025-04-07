// app/api/users/analytics/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function GET(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const languageCode = searchParams.get('languageCode');
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'year'
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Build query filters
    const filters = {
      userId: auth.userId,
      recordDate: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (languageCode) {
      filters.languageCode = languageCode;
    }
    
    // Get progress records
    const progressRecords = await prisma.progressRecord.findMany({
      where: filters,
      orderBy: {
        recordDate: 'desc'
      }
    });
    
    // Get challenge completions
    const challengeCompletions = await prisma.userChallenge.findMany({
      where: {
        userId: auth.userId,
        status: 'COMPLETED',
        endDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        challenge: {
          select: {
            title: true,
            languageCode: true,
            stakeAmount: true,
            yieldPercentage: true
          }
        }
      }
    });
    
    // Get practice minutes
    const practiceMinutes = await prisma.dailyProgress.findMany({
      where: {
        userChallenge: {
          userId: auth.userId
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        date: true,
        minutesPracticed: true,
        userChallenge: {
          select: {
            challenge: {
              select: {
                languageCode: true
              }
            }
          }
        }
      }
    });
    
    // Aggregate practice minutes by day and language
    const practiceByDay = {};
    
    practiceMinutes.forEach(record => {
      const lang = record.userChallenge.challenge.languageCode;
      const dateStr = record.date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!practiceByDay[dateStr]) {
        practiceByDay[dateStr] = {};
      }
      
      if (!practiceByDay[dateStr][lang]) {
        practiceByDay[dateStr][lang] = 0;
      }
      
      practiceByDay[dateStr][lang] += record.minutesPracticed;
    });
    
    // Get current streaks for each language
    const userLanguages = await prisma.userLanguage.findMany({
      where: {
        userId: auth.userId
      }
    });
    
    const streaksByLanguage = {};
    
    for (const lang of userLanguages) {
      // Get daily progress records for this language
      const langProgress = await prisma.dailyProgress.findMany({
        where: {
          userChallenge: {
            userId: auth.userId,
            challenge: {
              languageCode: lang.languageCode
            }
          },
          completed: true
        },
        orderBy: {
          date: 'desc'
        },
        select: {
          date: true
        }
      });
      
      // Calculate current streak
      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if there's a record for today
      const hasToday = langProgress.some(p => {
        const recordDate = new Date(p.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      
      if (hasToday) {
        streak = 1;
        
        // Check previous days
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        
        while (true) {
          const hasDay = langProgress.some(p => {
            const recordDate = new Date(p.date);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === checkDate.getTime();
          });
          
          if (hasDay) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      
      streaksByLanguage[lang.languageCode] = streak;
    }
    
    // Compile analytics data
    const analytics = {
      progressRecords,
      challengeCompletions,
      practiceByDay,
      streaksByLanguage,
      summary: {
        totalPracticeMinutes: practiceMinutes.reduce((sum, record) => sum + record.minutesPracticed, 0),
        challengesCompleted: challengeCompletions.length,
        totalEarned: challengeCompletions.reduce((sum, challenge) => {
          const reward = challenge.challenge.stakeAmount * (1 + challenge.challenge.yieldPercentage / 100);
          return sum + reward;
        }, 0)
      }
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}