import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// API Pappers - enrichissement d'entreprises françaises
async function enrichWithPappers(siret: string) {
  const apiKey = process.env.PAPPERS_API_KEY;

  if (!apiKey) {
    throw new Error('PAPPERS_API_KEY non configurée');
  }

  const response = await fetch(
    `https://api.pappers.fr/v2/entreprise?api_token=${apiKey}&siret=${siret}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    throw new Error(`Erreur Pappers API: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    name: data.nom_entreprise,
    siret: data.siret,
    legalForm: data.forme_juridique,
    activity: data.libelle_code_naf,
    address: data.siege?.adresse_ligne_1,
    postalCode: data.siege?.code_postal,
    city: data.siege?.ville,
    gerant: data.representants?.[0]?.nom_complet,
    revenue: data.finances?.[0]?.chiffre_affaires,
    employees: data.tranche_effectif_salarie,
    status: data.statut_rcs,
    solvencyScore: data.score_solvabilite,
    enrichedBy: 'pappers',
    enrichmentData: JSON.stringify(data),
  };
}

// API MList (Manageo) - enrichissement d'entreprises françaises
async function enrichWithMList(siret: string) {
  const apiKey = process.env.MLIST_API_KEY;

  if (!apiKey) {
    throw new Error('MLIST_API_KEY non configurée');
  }

  // Note: Adapter selon la vraie API MList
  const response = await fetch(
    `https://api.manageo.fr/v1/entreprises/${siret}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erreur MList API: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    name: data.denomination,
    siret: data.siret,
    legalForm: data.forme_juridique,
    activity: data.activite,
    address: data.adresse?.ligne1,
    postalCode: data.adresse?.code_postal,
    city: data.adresse?.ville,
    gerant: data.dirigeant,
    revenue: data.chiffre_affaires,
    employees: data.effectif,
    solvencyScore: data.note_solvabilite,
    enrichedBy: 'mlist',
    enrichmentData: JSON.stringify(data),
  };
}

// POST /api/prospects/enrich - Enrichir un prospect
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { prospectId, siret, provider } = body;

    if (!siret) {
      return NextResponse.json(
        { error: 'Le SIRET est requis pour l\'enrichissement' },
        { status: 400 }
      );
    }

    if (!provider || !['pappers', 'mlist'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider invalide. Utilisez "pappers" ou "mlist"' },
        { status: 400 }
      );
    }

    // Enrichir via l'API choisie
    let enrichedData;
    try {
      if (provider === 'pappers') {
        enrichedData = await enrichWithPappers(siret);
      } else {
        enrichedData = await enrichWithMList(siret);
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: `Erreur lors de l'enrichissement: ${error.message}` },
        { status: 500 }
      );
    }

    // Si un prospectId est fourni, mettre à jour le prospect
    if (prospectId) {
      const prospect = await prisma.prospects.update({
        where: { id: prospectId },
        data: {
          ...enrichedData,
          enrichedAt: new Date(),
          qualityScore: calculateQualityScore(enrichedData),
        },
      });

      return NextResponse.json({ success: true, prospect });
    }

    // Sinon, retourner les données enrichies
    return NextResponse.json({
      success: true,
      data: {
        ...enrichedData,
        qualityScore: calculateQualityScore(enrichedData),
      },
    });
  } catch (error) {
    console.error('Erreur enrichissement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'enrichissement' },
      { status: 500 }
    );
  }
}

// Calculer un score de qualité basé sur les données disponibles
function calculateQualityScore(data: any): number {
  let score = 0;

  // Données de base (40 points)
  if (data.name) score += 10;
  if (data.siret) score += 10;
  if (data.activity) score += 10;
  if (data.address && data.city) score += 10;

  // Contact (30 points)
  if (data.phone) score += 15;
  if (data.email) score += 15;

  // Données enrichies (30 points)
  if (data.revenue) score += 10;
  if (data.employees) score += 10;
  if (data.solvencyScore) score += 10;

  return Math.min(100, score);
}
