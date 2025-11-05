import { NextResponse } from 'next/server';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
    try {
        await connectDB();
        
        // Get all users (without passwords for security)
        const users = await User.find({}, { password: 0 });
        
        return NextResponse.json({
            success: true,
            count: users.length,
            users: users
        });
        
    } catch (error) {
        console.error('Debug users error:', error);
        return NextResponse.json({ 
            success: false,
            message: "Error fetching users",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}
