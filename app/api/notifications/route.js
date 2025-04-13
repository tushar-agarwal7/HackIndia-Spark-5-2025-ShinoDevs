// app/api/notifications/route.js (update to proper implementation)
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
    // Get notifications sorted by creation date (newest first)
    const notifications = await prisma.notification.findMany({
      where: {
        userId: auth.userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to most recent 50
    });
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}