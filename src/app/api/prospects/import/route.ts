import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Statuts qui déclenchent la création d'un deal
const DEAL_STAGES = ['A_CONTACTER', 'EN_DISCUSSION', 'A_RELANCER', 'RDV_PRIS', 'NEGO_HOT'];
const VALID_STATUSES = ['A_TRAITER', ...DEAL_STAGES, 'NON_QUALIFIE'];

// Probabilités par stage
const STAGE_PROBABILITIES: Record<string, number> = {
  A_CONTACTER: 10,
  EN_DISCUSSION: 30,
  A_RELANCER: 20,
  RDV_PRIS: 50,
  NEGO_HOT: 70,
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const assignedToId = formData.get('assignedToId') as string | null;
    const enrichWith = formData.get('enrichWith') as string | null; // "pappers", "mlist", "none"
    const defaultStatus = formData.get('defaultStatus') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifier que c'est un fichier CSV
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Le fichier doit être au format CSV' },
        { status: 400 }
      );
    }

    // Lire le contenu du fichier
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Le fichier CSV est vide ou ne contient pas de données' },
        { status: 400 }
      );
    }

    // Parser le CSV (format attendu: nom,siret,activite,adresse,ville,code_postal,telephone,email,site_web)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dataLines = lines.slice(1);

    // Créer le batch d'import
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await prisma.import_batches.create({
      data: {
        id: batchId,
        fileName: file.name,
        totalRows: dataLines.length,
        uploadedById: session.user.id,
        assignedToId: assignedToId || null,
        enrichWith: enrichWith || 'none',
        status: 'EN_COURS',
      },
    });

    // Traiter chaque ligne
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;

      try {
        const values = line.split(',').map(v => v.trim());
        const rowData: any = {};

        headers.forEach((header, index) => {
          rowData[header] = values[index] || '';
        });

        // Utiliser le statut par défaut passé par le frontend, sinon celui du CSV, sinon A_TRAITER
        let csvStatus = defaultStatus || (rowData.statut || rowData.status || 'A_TRAITER').toUpperCase();
        if (!VALID_STATUSES.includes(csvStatus)) {
          csvStatus = 'A_TRAITER';
        }

        const shouldCreateDeal = DEAL_STAGES.includes(csvStatus);
        const prospectId = `PROS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Mapping des champs CSV vers les champs de la base
        const prospectData: any = {
          id: prospectId,
          name: rowData.nom || rowData.name || rowData.entreprise || '',
          siret: rowData.siret || null,
          activity: rowData.activite || rowData.activity || rowData.secteur || '',
          address: rowData.adresse || rowData.address || '',
          city: rowData.ville || rowData.city || '',
          postalCode: rowData.code_postal || rowData.postal_code || rowData.cp || null,
          phone: rowData.telephone || rowData.phone || rowData.tel || null,
          email: rowData.email || rowData.mail || null,
          website: rowData.site_web || rowData.website || rowData.site || null,
          employees: rowData.effectif || rowData.employees || null,
          source: 'csv_import',
          importBatchId: batchId,
          assignedToId: assignedToId || null,
          status: csvStatus,
          convertedToDeal: shouldCreateDeal,
          convertedAt: shouldCreateDeal ? new Date() : null,
          updatedAt: new Date(),
        };

        // Valider que les champs obligatoires sont présents
        if (!prospectData.name || !prospectData.activity) {
          throw new Error('Nom et activité sont obligatoires');
        }

        // Créer le prospect
        await prisma.prospects.create({ data: prospectData });

        // Si statut deal, créer automatiquement le deal
        if (shouldCreateDeal) {
          const dealOwnerId = assignedToId || session.user.id;
          await prisma.deals.create({
            data: {
              id: `DEAL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              title: prospectData.name,
              description: `Prospect importé: ${prospectData.activity}`,
              value: 0,
              currency: 'EUR',
              stage: csvStatus as any,
              probability: STAGE_PROBABILITIES[csvStatus] || 10,
              ownerId: dealOwnerId,
              updatedAt: new Date(),
            },
          });
        }

        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push({
          line: i + 2, // +2 car ligne 1 = headers et index commence à 0
          error: error.message,
        });
      }
    }

    // Mettre à jour le batch
    await prisma.import_batches.update({
      where: { id: batchId },
      data: {
        processedRows: dataLines.length,
        successRows: successCount,
        errorRows: errorCount,
        status: errorCount === dataLines.length ? 'ERREUR' : 'COMPLETE',
        completedAt: new Date(),
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
      },
    });

    return NextResponse.json({
      success: true,
      batch: {
        id: batchId,
        totalRows: dataLines.length,
        successRows: successCount,
        errorRows: errorCount,
        errors: errors.length > 0 ? errors : null,
      },
    });
  } catch (error) {
    console.error('Erreur import CSV:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import du CSV' },
      { status: 500 }
    );
  }
}
