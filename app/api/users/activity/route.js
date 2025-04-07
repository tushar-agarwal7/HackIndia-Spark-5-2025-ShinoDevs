// app/api/users/activity/route.js
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
    const period = searchParams.get('period') || 'week'; // 'week', 'month'
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
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
    
    return NextResponse.json({ practiceByDay });
  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 });
  }
}