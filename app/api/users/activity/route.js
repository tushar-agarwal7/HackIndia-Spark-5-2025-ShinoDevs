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
    // Get combination of different activity types
    const userId = auth.userId;
    
    // Get recent conversations
    const conversations = await prisma.aIConversation.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 5,
      include: {
        messages: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });
    
    // Get challenge activities
    const challengeActivities = await prisma.userChallenge.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      take: 5,
      include: {
        challenge: true
      }
    });
    
    // Get achievements
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      take: 5,
      include: {
        achievement: true
      }
    });
    
    // Combine and format activities
    const formattedActivities = [
      // Format conversation activities
      ...conversations.map(conv => ({
        id: `conv-${conv.id}`,
        type: 'practice',
        language: conv.languageCode,
        details: `Practiced ${conv.durationMinutes || 0} minutes of conversation`,
        timestamp: conv.startedAt.toISOString()
      })),
      
      // Format challenge activities
      ...challengeActivities.map(uc => ({
        id: `challenge-${uc.id}`,
        type: 'challenge',
        language: uc.challenge.languageCode,
        details: `${uc.status === 'ACTIVE' ? 'Joined' : uc.status === 'COMPLETED' ? 'Completed' : 'Participated in'} "${uc.challenge.title}"`,
        timestamp: uc.startDate.toISOString()
      })),
      
      // Format achievement activities
      ...achievements.map(ua => ({
        id: `achievement-${ua.id}`,
        type: 'achievement',
        language: '', // Achievement might not have a specific language
        details: `Earned "${ua.achievement.name}" achievement`,
        timestamp: ua.earnedAt.toISOString()
      }))
    ];
    
    // Sort by timestamp, most recent first
    formattedActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Return the top 10 activities
    return NextResponse.json({ 
      activities: formattedActivities.slice(0, 10) 
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}