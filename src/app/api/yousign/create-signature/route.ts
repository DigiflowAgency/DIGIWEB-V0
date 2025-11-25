import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const YOUSIGN_API_KEY = '3Ad8KJwqK04rDfqbM7RGF8V7NKFcyjNN';
const YOUSIGN_API_URL = 'https://api-sandbox.yousign.app/v3';
const TEMPLATE_ID = '619b6137-abc4-4dcf-867c-775cb127cc25';

// POST /api/yousign/create-signature - Créer une signature électronique
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'ID du devis requis' }, { status: 400 });
    }

    // Récupérer le devis
    const quote = await prisma.quotes.findUnique({
      where: { id: quoteId },
      include: {
        quote_products: true,
        contacts: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 });
    }

    // Créer la signature request depuis le template
    // Le template contient déjà les signers, on utilise juste les infos du devis pour les remplir
    const yousignPayload: any = {
      name: `Contrat - ${quote.clientName}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
    };

    // Ajouter le template_id
    if (TEMPLATE_ID) {
      yousignPayload.template_id = TEMPLATE_ID;
    }

    console.log('📤 Envoi à Yousign:', JSON.stringify(yousignPayload, null, 2));

    // Appeler l'API Yousign
    const yousignResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(yousignPayload),
    });

    const yousignData = await yousignResponse.json();

    if (!yousignResponse.ok) {
      console.error('❌ Erreur Yousign:', yousignData);
      return NextResponse.json(
        { error: 'Erreur Yousign', details: yousignData },
        { status: yousignResponse.status }
      );
    }

    console.log('✅ Signature créée:', yousignData);

    // Mettre à jour le devis avec l'ID Yousign
    await prisma.quotes.update({
      where: { id: quoteId },
      data: {
        yousignId: yousignData.id,
        status: 'ENVOYE',
      },
    });

    return NextResponse.json({
      success: true,
      signatureRequest: yousignData,
      message: 'Demande de signature envoyée au client',
    });
  } catch (error) {
    console.error('❌ Erreur création signature:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
