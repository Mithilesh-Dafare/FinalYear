import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        // Get cookies from the request
        const cookies = req.headers.get('cookie') || '';
        console.log('[Debug] Cookies received:', cookies);
        
        // Parse token from cookies
        const tokenMatch = cookies.match(/token=([^;]+)/);
        const token = tokenMatch ? tokenMatch[1] : null;
        
        const userDataMatch = cookies.match(/user_data=([^;]+)/);
        const userData = userDataMatch ? decodeURIComponent(userDataMatch[1]) : null;
        
        return NextResponse.json({
            success: true,
            cookies: cookies,
            token: token ? token.substring(0, 20) + '...' : null,
            userData: userData,
            hasToken: !!token,
            hasUserData: !!userData
        });
        
    } catch (error) {
        console.error('Auth test error:', error);
        return NextResponse.json({ 
            success: false,
            message: "Error testing auth",
            error: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}
