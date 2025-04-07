// app/api/users/profile/route.js
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
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        learningLanguages: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: user.id,
      walletAddress: user.walletAddress,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      nativeLanguage: user.nativeLanguage,
      learningLanguages: user.learningLanguages,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Update user profile
export async function PUT(request) {
  const auth = await verifyAuth();
  
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Validate request body
    if (!body.username || !body.email) {
      return NextResponse.json({ error: 'Username and email are required' }, { status: 400 });
    }
    
    // Create transaction to update user and learning languages
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user basic info
      const user = await tx.user.update({
        where: { id: auth.userId },
        data: {
          username: body.username,
          email: body.email,
          nativeLanguage: body.nativeLanguage,
          avatarUrl: body.avatarUrl,
        },
        include: {
          learningLanguages: true
        }
      });
      
      // Update learning languages if provided
      if (body.learningLanguages && body.learningLanguages.length > 0) {
        // Get existing language codes for this user
        const existingLanguages = user.learningLanguages.map(lang => lang.languageCode);
        
        // Find languages to add (not in existing languages)
        const languagesToAdd = body.learningLanguages.filter(
          lang => !existingLanguages.includes(lang.languageCode)
        );
        
        // Add new languages
        if (languagesToAdd.length > 0) {
          await Promise.all(
            languagesToAdd.map(lang => 
              tx.userLanguage.create({
                data: {
                  userId: auth.userId,
                  languageCode: lang.languageCode,
                  proficiencyLevel: lang.proficiencyLevel,
                }
              })
            )
          );
        }
        
        // Update existing languages
        await Promise.all(
          body.learningLanguages
            .filter(lang => existingLanguages.includes(lang.languageCode))
            .map(lang => 
              tx.userLanguage.update({
                where: {
                  userId_languageCode: {
                    userId: auth.userId,
                    languageCode: lang.languageCode
                  }
                },
                data: {
                  proficiencyLevel: lang.proficiencyLevel
                }
              })
            )
        );
      }
      
      // Return updated user with fresh learning languages
      return tx.user.findUnique({
        where: { id: auth.userId },
        include: {
          learningLanguages: true
        }
      });
    });
    
    return NextResponse.json({
      id: updatedUser.id,
      walletAddress: updatedUser.walletAddress,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl,
      nativeLanguage: updatedUser.nativeLanguage,
      learningLanguages: updatedUser.learningLanguages,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
