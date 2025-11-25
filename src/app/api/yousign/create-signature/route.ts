import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const YOUSIGN_API_KEY = '3Ad8KJwqK04rDfqbM7RGF8V7NKFcyjNN';
const YOUSIGN_API_URL = 'https://api-sandbox.yousign.app/v3'; // Sandbox
const TEMPLATE_ID = '53afec24-1f5f-4619-bf23-81d01aab9f18';

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

    // Préparer les données du devis pour les champs read-only
    const clientInfo = `${quote.clientName}\n${quote.clientEmail}\n${quote.clientAddress || ''}`;
    const prestations = quote.quote_products
      ?.map((p: any) => `- ${p.name} (${p.quantity}x ${p.unitPrice}€)`)
      .join('\n') || '';
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Créer la signature request depuis le template
    // Utiliser template_placeholders pour remplacer les placeholder signers et remplir les champs
    const yousignPayload: any = {
      name: `Contrat - ${quote.clientName}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
      template_id: TEMPLATE_ID,
      template_placeholders: {
        signers: [
          {
            label: 'client',
            info: {
              first_name: quote.clientName.split(' ')[0] || quote.clientName,
              last_name: quote.clientName.split(' ').slice(1).join(' ') || 'Client',
              email: quote.clientEmail,
              locale: 'fr',
            },
          },
        ],
        read_only_text_fields: [
          {
            label: 'client_info',
            text: clientInfo,
          },
          {
            label: 'prestations',
            text: prestations,
          },
          {
            label: 'date_signature',
            text: today,
          },
          {
            label: 'montant_total',
            text: `${quote.total.toLocaleString('fr-FR')} €`,
          },
        ],
      },
    };

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
