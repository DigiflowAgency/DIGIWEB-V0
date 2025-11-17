import { PrismaClient } from '@prisma/client';

// Singleton pattern pour Prisma Client
// En développement, Next.js Hot Reload peut créer plusieurs instances
// Ce pattern évite d'atteindre la limite de connexions MySQL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Helper pour déconnecter Prisma (utile pour les scripts)
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
