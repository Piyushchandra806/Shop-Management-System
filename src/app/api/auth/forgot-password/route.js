import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const { identifier } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Email or Phone Number is required' }, { status: 400 });
    }

    // Try to find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim() },
          { phone: identifier.trim() }
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'No user account found with this email or phone number' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpiresAt: expiresAt
      }
    });

    // Log the OTP (Simulate SMS Gateway)
    console.log(`[SMS Gateway Sim] Sending OTP code to ${user.phone}: ${otp}`);

    return NextResponse.json({
      message: 'OTP sent successfully',
      phone: user.phone,
      debugOtp: otp // Returned for easy mock UI simulation in development
    });
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
