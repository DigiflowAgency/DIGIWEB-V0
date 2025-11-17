import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function middleware(req) {
    // Cette fonction est appelée uniquement si l'utilisateur est authentifié
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Retourne true si l'utilisateur a un token valide
        return !!token;
      },
    },
    pages: {
      signIn: '/login',
    },
  }
);

// Protéger toutes les routes /dashboard
export const config = {
  matcher: ['/dashboard/:path*'],
};
