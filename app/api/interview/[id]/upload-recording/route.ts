import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '../../../../../lib/db';
import { uploadToS3 } from '@/lib/s3Client';
import Interview from '@/models/Interview';
import { Types } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Get and verify the authorization token
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = await verifyToken(token) as JwtPayload & { userId: string };
      if (!decoded.userId) throw new Error('Invalid token payload');
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 2. Validate interview ID
    const interviewId = (await params).id;
    if (!Types.ObjectId.isValid(interviewId)) {
      return NextResponse.json(
        { error: 'Invalid interview ID' },
        { status: 400 }
      );
    }

    // 3. Parse form data
    const formData = await req.formData();
    const file = formData.get('video') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // 4. Verify user owns the interview
    await connectDB();
    const interview = await Interview.findOne({
      _id: interviewId,
      user: userId,
    });

    if (!interview) {
      return NextResponse.json(
        { error: 'Interview not found or access denied' },
        { status: 404 }
      );
    }

    // 5. Generate unique key for S3
    const fileKey = `users/${userId}/interviews/${interviewId}.webm`;
    
    // 6. Upload to S3
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileToUpload = new File([fileBuffer], fileKey, { type: file.type });
    
    const publicUrl = await uploadToS3(fileToUpload, fileKey);

    // 7. Update interview with recording details
    interview.recording = {
      url: publicUrl,
      key: fileKey,
      mimeType: file.type,
      size: file.size,
      duration: 0, // You can extract duration from the client if needed
    };

    await interview.save();

    // 8. Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
    });

  } catch (error) {
    console.error('Error uploading recording:', error);
    return NextResponse.json(
      { error: 'Failed to upload recording' },
      { status: 500 }
    );
  }
}
