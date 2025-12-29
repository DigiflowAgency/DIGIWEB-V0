import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validation
const initSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  copyFromPrevious: z.boolean().default(false),
  defaults: z.object({
    CA_MENSUEL: z.number().optional(),
    NOUVEAUX_DEALS: z.number().optional(),
    RDV_REALISES: z.number().optional(),
    APPELS_EFFECTUES: z.number().optional(),
    DEVIS_ENVOYES: z.number().optional(),
  }).optional(),
});

// Types d'objectifs par defaut avec leurs valeurs
const DEFAULT_OBJECTIVES = [
  { metricType: 'CA_MENSUEL', title: 'CA Mensuel', defaultTarget: 60000 },
  { metricType: 'NOUVEAUX_DEALS', title: 'Nouveaux Deals', defaultTarget: 12 },
  { metricType: 'RDV_REALISES', title: 'RDV Realises', defaultTarget: 30 },
  { metricType: 'APPELS_EFFECTUES', title: 'Appels Effectues', defaultTarget: 200 },
  { metricType: 'DEVIS_ENVOYES', title: 'Devis Envoyes', defaultTarget: 15 },
];

// Noms des mois en francais
const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

// POST /api/enterprise-objectives/init
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    // Verifier que l'utilisateur est admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent initialiser les objectifs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = initSchema.parse(body);
    const { year, month, copyFromPrevious, defaults } = validatedData;

    // Verifier si des objectifs existent deja pour ce mois
    const existingCount = await prisma.enterprise_objectives.count({
      where: {
        year,
        month,
        period: 'MONTHLY',
      },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: `Des objectifs existent deja pour ${MONTH_NAMES[month - 1]} ${year}` },
        { status: 409 }
      );
    }

    let targetValues: Record<string, number> = {};

    if (copyFromPrevious) {
      // Calculer le mois precedent
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;

      // Recuperer les objectifs du mois precedent
      const previousObjectives = await prisma.enterprise_objectives.findMany({
        where: {
          year: prevYear,
          month: prevMonth,
          period: 'MONTHLY',
        },
      });

      if (previousObjectives.length === 0) {
        return NextResponse.json(
          { error: `Aucun objectif trouve pour ${MONTH_NAMES[prevMonth - 1]} ${prevYear}` },
          { status: 404 }
        );
      }

      // Utiliser les valeurs du mois precedent
      previousObjectives.forEach((obj) => {
        targetValues[obj.metricType] = obj.targetValue;
      });
    } else if (defaults) {
      // Utiliser les valeurs par defaut fournies
      targetValues = defaults as Record<string, number>;
    }

    // Creer les objectifs
    const createdObjectives = [];
    for (const defaultObj of DEFAULT_OBJECTIVES) {
      const targetValue = targetValues[defaultObj.metricType] || defaultObj.defaultTarget;

      const objective = await prisma.enterprise_objectives.create({
        data: {
          metricType: defaultObj.metricType as any,
          period: 'MONTHLY',
          year,
          month,
          targetValue,
          title: `${defaultObj.title} ${MONTH_NAMES[month - 1]} ${year}`,
          isActive: true,
        },
      });

      createdObjectives.push(objective);
    }

    return NextResponse.json(
      {
        message: `${createdObjectives.length} objectifs crees pour ${MONTH_NAMES[month - 1]} ${year}`,
        objectives: createdObjectives,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST /api/enterprise-objectives/init:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
