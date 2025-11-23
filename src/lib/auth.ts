import type { NextAuthOptions } from 'next-auth';
import { getServerSession as nextGetServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'alex@digiweb.fr' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email et mot de passe requis');
        }

        // Chercher l'utilisateur dans la base de données
        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Aucun utilisateur trouvé avec cet email');
        }

        // Vérifier le statut de l'utilisateur
        if (user.status !== 'ACTIVE') {
          throw new Error('Compte inactif ou suspendu');
        }

        // Vérifier le mot de passe
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Mot de passe incorrect');
        }

        // Retourner l'utilisateur (sans le password)
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Ajouter des infos custom au token JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },

    async session({ session, token }) {
      // Ajouter des infos custom à la session
      if (token) {
        session.user = {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as string,
          avatar: token.avatar as string | null,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: '/login', // Page de login custom
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

// Helper pour récupérer la session côté serveur
export async function getServerSession() {
  return await nextGetServerSession(authOptions);
}

// Helper pour récupérer l'utilisateur actuel
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user;
}
