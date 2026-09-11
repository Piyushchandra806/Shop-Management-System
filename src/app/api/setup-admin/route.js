import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, password, setupSecret } = body;

    // Check if any admin already exists
    const adminCount = await prisma.user.count({
      where: { role: 'admin' },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Administrator account already exists. Initial setup is disabled.' },
        { status: 403 }
      );
    }

    // Verify setup secret
    const serverSecret = process.env.ADMIN_SETUP_SECRET;
    if (!serverSecret || setupSecret !== serverSecret) {
      return NextResponse.json(
        { error: 'Invalid or missing setup secret.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'All fields are required: name, email, phone, and password.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if the email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the admin user
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash,
        role: 'admin',
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: 'Admin account created successfully.', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST Setup Admin Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
