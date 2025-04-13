// app/api/notifications/[id]/read/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth/verify';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = params;
    
    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: {
        id,
        userId: auth.userId
      }
    });
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }
    
    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    
    return NextResponse.json(updatedNotification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}