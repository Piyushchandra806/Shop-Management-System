import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Settings, Customers, and Reports pages are admin-only
    if ((path.startsWith('/settings') || path.startsWith('/customers') || path.startsWith('/reports')) && token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/orders/:path*',
    '/customers/:path*',
    '/inventory/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/tasks/:path*',
  ],
};
