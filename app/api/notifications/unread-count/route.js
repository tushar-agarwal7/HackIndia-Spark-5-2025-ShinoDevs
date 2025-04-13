// app/api/notifications/unread-count/route.js
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
    // Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId: auth.userId,
        read: false
      }
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return NextResponse.json({ error: 'Failed to count notifications' }, { status: 500 });
  }
}