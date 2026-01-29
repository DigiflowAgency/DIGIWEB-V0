import 'next-auth';
import 'next-auth/jwt';
import { users_status } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar: string | null;
      status: users_status;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string | null;
  }
}
