import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: Request) {
    try {
        console.log('Connecting to database...');
        await connectDB();
        console.log('Database connected successfully');

        const { email, password } = await req.json();

        console.log(`Login attempt for email: ${email}`);
        console.log(`Password provided: ${password ? 'Yes' : 'No'}`);

        if (!email || !password) {
            console.log('Missing email or password');
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        // Check if user exists
        console.log('Searching for user in database...');
        const user = await User.findOne({ email });
        console.log(`User found: ${user ? 'Yes' : 'No'}`);
        
        if (user) {
            console.log(`User details: ID=${user._id}, Name=${user.name}, Email=${user.email}`);
            console.log(`Stored password hash: ${user.password ? 'Present' : 'Missing'}`);
        }

        if (!user) {
            console.log(`User not found: ${email}`);
            return NextResponse.json({ message: 'User not found. Please check your email or sign up.' }, { status: 401 });
        }

        // Compare password
        console.log('Comparing password...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match: ${isMatch ? 'Yes' : 'No'}`);

        if (!isMatch) {
            console.log(`Invalid password for user: ${email}`);
            return NextResponse.json({ message: 'Invalid password. Please try again.' }, { status: 401 });
        }

        // Generate JWT token
        const tokenData = { userId: user._id.toString(), email: user.email };
        console.log(`Creating token for user: ${JSON.stringify(tokenData)}`);
        
        const token = jwt.sign(
            tokenData,
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        console.log(`Token created successfully: ${token.substring(0, 20)}...`);

        // Return token directly in the response
        return NextResponse.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ 
            success: false,
            message: "Internal Server Error",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}