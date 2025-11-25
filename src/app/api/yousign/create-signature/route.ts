import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateContract } from '@/lib/generateContract';

const YOUSIGN_API_KEY = '3Ad8KJwqK04rDfqbM7RGF8V7NKFcyjNN';
const YOUSIGN_API_URL = 'https://api-sandbox.yousign.app/v3'; // Sandbox

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

    console.log('📄 Génération du PDF du contrat...');

    // Générer le PDF avec les données du devis
    const pdfBuffer = await generateContract({
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      clientAddress: quote.clientAddress,
      clientSiret: quote.contacts?.siret || null,
      commitmentPeriod: quote.commitmentPeriod,
      subtotal: quote.subtotal,
      quote_products: quote.quote_products as any[],
    });

    console.log('✅ PDF généré, taille:', pdfBuffer.length, 'bytes');

    // Convertir le PDF en base64 pour Yousign
    const pdfBase64 = pdfBuffer.toString('base64');

    // Créer la signature request avec le document
    const yousignPayload = {
      name: `Contrat - ${quote.clientName}`,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
      documents: [
        {
          nature: 'signable_document',
          parse_anchors: false,
          file: {
            name: `Contrat_${quote.number}.pdf`,
            content: pdfBase64,
          },
        },
      ],
      signers: [
        {
          info: {
            first_name: quote.clientName.split(' ')[0] || quote.clientName,
            last_name: quote.clientName.split(' ').slice(1).join(' ') || 'Client',
            email: quote.clientEmail,
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_email',
          fields: [
            {
              document_id: 0, // Premier document
              type: 'signature',
              page: 4, // Page 4 pour la signature
              x: 100,
              y: 200,
              width: 200,
              height: 50,
            },
          ],
        },
      ],
    };

    console.log('📤 Envoi à Yousign...');

    // Appeler l'API Yousign pour créer la signature request
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

    console.log('✅ Signature request créée:', yousignData.id);

    // Activer la signature request (pour l'envoyer au client)
    const activateResponse = await fetch(`${YOUSIGN_API_URL}/signature_requests/${yousignData.id}/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!activateResponse.ok) {
      const activateError = await activateResponse.json();
      console.error('❌ Erreur activation:', activateError);
      return NextResponse.json(
        { error: 'Erreur activation Yousign', details: activateError },
        { status: activateResponse.status }
      );
    }

    console.log('✅ Demande de signature activée et envoyée au client');

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
