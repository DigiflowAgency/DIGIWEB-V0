import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères'),
  role: z.enum(['ADMIN', 'VENTE', 'MARKETING', 'ACCOUNT_MANAGEMENT', 'DEVELOPPEUR']),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  monthlyGoal: z.number().optional(),
});

// GET /api/users - Récupérer tous les utilisateurs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Tous les utilisateurs authentifiés peuvent voir la liste (pour assignation)
    // Filtrer par rôle si spécifié
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    const where: any = {};
    if (roleFilter) {
      where.role = roleFilter;
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        position: true,
        department: true,
        monthlyGoal: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { id: 'asc' },  // Fallback deterministe
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erreur GET /api/users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST /api/users - Créer un nouvel utilisateur (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent créer des utilisateurs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.users.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur
    const user = await prisma.users.create({
      data: {
        id: `USER-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        status: 'ACTIVE',
        phone: validatedData.phone || null,
        position: validatedData.position || null,
        department: validatedData.department || null,
        monthlyGoal: validatedData.monthlyGoal || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        position: true,
        department: true,
        monthlyGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/users:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
