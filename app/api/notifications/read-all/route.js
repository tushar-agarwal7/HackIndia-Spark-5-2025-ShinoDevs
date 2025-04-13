// app/api/notifications/read-all/route.js
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
    // Mark all user's notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: auth.userId,
        read: false
      },
      data: {
        read: true
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      count: result.count 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}