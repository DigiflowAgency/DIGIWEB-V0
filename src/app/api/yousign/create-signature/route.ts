import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateContract } from '@/lib/generateContract';

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY;
const YOUSIGN_API_URL = process.env.YOUSIGN_API_URL || 'https://api-sandbox.yousign.app/v3';

// POST /api/yousign/create-signature - Créer une signature électronique
export async function POST(request: NextRequest) {
  try {
    // Vérifier que la clé API Yousign est configurée
    if (!YOUSIGN_API_KEY) {
      console.error('❌ YOUSIGN_API_KEY non définie dans les variables d\'environnement');
      return NextResponse.json(
        { error: 'Configuration Yousign manquante' },
        { status: 500 }
      );
    }

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

    // Étape 1 : Upload du document sur Yousign
    console.log('📤 Upload du document sur Yousign...');
    const documentFormData = new FormData();
    const uint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    documentFormData.append('file', blob, `Contrat_${quote.number}.pdf`);
    documentFormData.append('nature', 'signable_document');

    const uploadResponse = await fetch(`${YOUSIGN_API_URL}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUSIGN_API_KEY}`,
      },
      body: documentFormData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.json();
      console.error('❌ Erreur upload document:', uploadError);
      return NextResponse.json(
        { error: 'Erreur upload document Yousign', details: uploadError },
        { status: uploadResponse.status }
      );
    }

    const documentData = await uploadResponse.json();
    const documentId = documentData.id;
    console.log('✅ Document uploadé, ID:', documentId);

    // Étape 2 : Créer la signature request avec 2 signataires
    console.log('📤 Création de la signature request...');

    // Extraire prénom et nom du client
    const clientNameParts = quote.clientName.split(' ');
    const clientFirstName = clientNameParts[0] || quote.clientName;
    const clientLastName = clientNameParts.slice(1).join(' ') || 'Client';

    const yousignPayload = {
      name: `Contrat - ${quote.clientName}`,
      delivery_mode: 'email', // Email pour les notifications
      timezone: 'Europe/Paris',
      ordered_signers: true, // Signature séquentielle : DIGIFLOW puis Client
      documents: [documentId],
      signers: [
        // Signataire 1 : DIGIFLOW (signe en premier)
        {
          info: {
            first_name: 'Jason',
            last_name: 'SOTOCA',
            email: 'jason@digiflow.fr',
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'no_otp', // Pas de code OTP pour DIGIFLOW
          fields: [
            {
              document_id: documentId,
              type: 'signature',
              page: 4,
              x: 100,
              y: 120,
              width: 150,
              height: 50,
            },
          ],
        },
        // Signataire 2 : Client (reçoit l'email après que DIGIFLOW ait signé)
        {
          info: {
            first_name: clientFirstName,
            last_name: clientLastName,
            email: quote.clientEmail,
            locale: 'fr',
          },
          signature_level: 'electronic_signature',
          signature_authentication_mode: 'otp_email',
          fields: [
            {
              document_id: documentId,
              type: 'signature',
              page: 4,
              x: 350,
              y: 120,
              width: 150,
              height: 50,
            },
          ],
        },
      ],
    };

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

    // Étape 3 : Activer la signature request
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

    const activatedData = await activateResponse.json();
    console.log('✅ Signature request activée');

    // Étape 4 : Récupérer le lien de signature DIGIFLOW
    // Le premier signataire dans la liste est DIGIFLOW
    const digiflowSigner = activatedData.signers?.[0];
    const digiflowSignatureLink = digiflowSigner?.signature_link;

    if (digiflowSignatureLink) {
      console.log('✅ Lien de signature DIGIFLOW récupéré');
    } else {
      console.log('⚠️ Lien de signature DIGIFLOW non trouvé dans la réponse');
    }

    // Mettre à jour le devis avec l'ID Yousign et le lien de signature
    await prisma.quotes.update({
      where: { id: quoteId },
      data: {
        yousignId: yousignData.id,
        status: 'ENVOYE',
        signatureUrl: digiflowSignatureLink || null,
      },
    });

    return NextResponse.json({
      success: true,
      signatureRequest: yousignData,
      // Lien pour que DIGIFLOW signe immédiatement
      digiflowSignatureLink: digiflowSignatureLink,
      message: 'Cliquez sur le lien pour signer. Le client recevra son email ensuite.',
    });
  } catch (error) {
    console.error('❌ Erreur création signature:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
