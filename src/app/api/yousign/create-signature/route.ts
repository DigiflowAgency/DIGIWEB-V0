import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const YOUSIGN_API_KEY = '3Ad8KJwqK04rDfqbM7RGF8V7NKFcyjNN';
const YOUSIGN_API_URL = 'https://api-sandbox.yousign.app/v3';
const TEMPLATE_ID = '7d9a4826-e29b-450d-aa0a-c715ce6dbb8f';

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

    // Préparer les données pour Yousign
    const clientInfo = `${quote.clientName}\n${quote.clientEmail}\n${quote.clientAddress || ''}`;

    // Préparer la liste des prestations
    const prestations = quote.quote_products
      ?.map((p: any) => `- ${p.name} (${p.quantity}x ${p.unitPrice}€)`)
      .join('\n') || '';

    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Créer la signature request avec Yousign
    const yousignPayload = {
      name: `Contrat - ${quote.clientName}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
      template_id: TEMPLATE_ID,
      signers: [
        {
          info: {
            first_name: quote.clientName.split(' ')[0] || quote.clientName,
            last_name: quote.clientName.split(' ').slice(1).join(' ') || '',
            email: quote.clientEmail,
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_sms',
        },
      ],
      custom_experience: {
        redirect_urls: {
          success: `${process.env.NEXTAUTH_URL}/dashboard/sales/quotes?signature=success`,
          error: `${process.env.NEXTAUTH_URL}/dashboard/sales/quotes?signature=error`,
        },
      },
      // Champs personnalisés à remplir dans le template
      fields: {
        client_info: clientInfo,
        prestations: prestations,
        date_signature: today,
        montant_total: `${quote.total.toLocaleString('fr-FR')} €`,
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
