import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/yousign/webhook - Recevoir les événements de signature Yousign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('📥 Webhook Yousign reçu:', JSON.stringify(body, null, 2));

    // Yousign envoie des événements avec cette structure:
    // {
    //   "event_name": "signature_request.done",
    //   "signature_request": { "id": "xxx", ... }
    // }

    const eventName = body.event_name;
    const signatureRequest = body.signature_request;

    if (!signatureRequest || !signatureRequest.id) {
      console.warn('⚠️ Webhook sans ID de signature request');
      return NextResponse.json({ error: 'Missing signature_request.id' }, { status: 400 });
    }

    const yousignId = signatureRequest.id;

    // Trouver le devis correspondant
    const quote = await prisma.quotes.findFirst({
      where: { yousignId },
    });

    if (!quote) {
      console.warn(`⚠️ Aucun devis trouvé pour yousignId: ${yousignId}`);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    console.log(`📄 Devis trouvé: ${quote.number} (ID: ${quote.id})`);

    // Traiter l'événement selon son type
    type QuoteStatus = 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';
    let newStatus: QuoteStatus | null = null;

    switch (eventName) {
      case 'signature_request.done':
        // Signature complétée avec succès
        newStatus = 'ACCEPTE';
        console.log('✅ Signature complétée');
        break;

      case 'signature_request.declined':
        // Client a refusé de signer
        newStatus = 'REFUSE';
        console.log('❌ Signature refusée');
        break;

      case 'signature_request.expired':
        // Demande expirée
        newStatus = 'EXPIRE';
        console.log('⏰ Signature expirée');
        break;

      case 'signature_request.activated':
        // Demande activée (envoyée au client)
        console.log('📤 Demande de signature activée');
        // Pas de changement de statut, déjà ENVOYE
        break;

      default:
        console.log(`ℹ️ Événement non géré: ${eventName}`);
        break;
    }

    // Mettre à jour le statut du devis si nécessaire
    if (newStatus) {
      await prisma.quotes.update({
        where: { id: quote.id },
        data: { status: newStatus },
      });

      console.log(`✅ Statut du devis ${quote.number} mis à jour: ${newStatus}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook traité',
      eventName,
      quoteNumber: quote.number,
      newStatus,
    });
  } catch (error) {
    console.error('❌ Erreur traitement webhook Yousign:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
