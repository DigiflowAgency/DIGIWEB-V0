import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

interface QuoteData {
  clientName: string;
  clientEmail: string;
  clientAddress: string | null;
  clientSiret?: string | null;
  commitmentPeriod?: string | null;
  subtotal: number;
  quote_products?: Array<{
    name: string;
    totalPrice: number;
    period?: string | null;
  }>;
}

// Helper pour formater les nombres sans espaces insécables (qui ne sont pas supportés par WinAnsi)
function formatPrice(amount: number): string {
  // Convertir le nombre en string avec séparateurs
  const formatted = Math.round(amount).toLocaleString('fr-FR');
  // Remplacer tous les espaces insécables (\u202f, \u00a0) par des espaces normaux
  return formatted.replace(/[\u202f\u00a0]/g, ' ');
}

export async function generateContract(quoteData: QuoteData): Promise<Buffer> {
  // Charger le template PDF
  const templatePath = path.join(process.cwd(), 'TRAME CONTRAT SITE DIGIFLOW.pdf');
  const templateBytes = await fs.readFile(templatePath);

  // Charger le PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();

  // Charger les polices
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ========== PAGE 1 - Informations du client ==========
  const page1 = pages[0];
  const { height: height1 } = page1.getSize();

  // Section "Et" - Informations client (d'après le PDF signé: SOFIANE DJERBI)
  let yPosition = height1 - 335; // Position précise après "Et"

  // Nom du client en gras
  page1.drawText(quoteData.clientName.toUpperCase(), {
    x: 110,
    y: yPosition,
    size: 10.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 17;

  // Entreprise si disponible (RIGORE CONSTRUCTION)
  if (quoteData.clientSiret) {
    page1.drawText(quoteData.clientSiret, {
      x: 110,
      y: yPosition,
      size: 10.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    yPosition -= 17;
  }

  yPosition -= 2; // Petit espace

  // Adresse client (81 ROUTE DES 3 LUCS)
  if (quoteData.clientAddress) {
    const addressLines = quoteData.clientAddress.split(',').map(line => line.trim());
    addressLines.forEach((line) => {
      page1.drawText(line, {
        x: 110,
        y: yPosition,
        size: 10.5,
        font: font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 15;
    });
  }

  // Période d'engagement (Article 2) - visible dans le PDF signé : "48 MOIS"
  const commitmentMonths = quoteData.commitmentPeriod && quoteData.commitmentPeriod !== 'comptant'
    ? parseInt(quoteData.commitmentPeriod)
    : 0;

  const commitmentText = commitmentMonths > 0 ? `${commitmentMonths} MOIS` : 'Sans engagement';

  // Position dans l'Article 2 - fin de la ligne "au terme de la période d'engagement prévue dans le contrat"
  // Ajustement précis après analyse du PDF signé
  page1.drawText(commitmentText, {
    x: 435,
    y: height1 - 676,
    size: 9,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ========== PAGE 3 - Prestations et montants ==========
  const page3 = pages[2];
  const { height: height3 } = page3.getSize();

  // Position de départ pour les prestations (après "DIGIFLOW s'engage à exécuter l'intégralité des prestations prévues :")
  let prestationY = height3 - 165;

  // Afficher chaque prestation avec son prix
  quoteData.quote_products?.forEach((product) => {
    const priceFormatted = `${formatPrice(product.totalPrice)}€`;
    const period = product.period && product.period !== 'paiement unique' ? `/${product.period}` : '';

    // Nom du service (gauche)
    const serviceName = product.name;
    page3.drawText(serviceName, {
      x: 50,
      y: prestationY,
      size: 9.5,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: 350,
    });

    // Prix (droite aligné)
    const priceText = `${priceFormatted}${period}`;
    page3.drawText(priceText, {
      x: 465,
      y: prestationY,
      size: 9.5,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    prestationY -= 14; // Ligne description

    // Description si disponible (texte plus petit, gris)
    if (product.name.includes('Site Web') || product.name.includes('Hébergement')) {
      const description = 'Design moderne, sur-mesure & responsive';
      page3.drawText(description, {
        x: 50,
        y: prestationY,
        size: 7.5,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
        maxWidth: 350,
      });
      prestationY -= 10;
    }

    prestationY -= 22; // Espace entre les prestations
  });

  // Ligne de total en bas de page 3 (comme dans le PDF signé)
  const totalY = 65;

  // Format: "23 146,67€ -> 0€ (offert partenaire)   410€/mois (Reste à charge)   48 mois"
  const totalOneTime = `${formatPrice(quoteData.subtotal)}€ -> 0€ (offert partenaire)`;
  const monthlyPayment = commitmentMonths > 0
    ? `${formatPrice(quoteData.subtotal / commitmentMonths)}€/mois (Reste a charge)`
    : '0€';
  const duration = commitmentMonths > 0 ? `${commitmentMonths} mois` : 'Comptant';

  // Total paiement unique
  page3.drawText(totalOneTime, {
    x: 50,
    y: totalY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Reste à charge mensuel
  page3.drawText(monthlyPayment, {
    x: 310,
    y: totalY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Durée
  page3.drawText(duration, {
    x: 510,
    y: totalY,
    size: 8.5,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // ========== PAGE 4 - Date de signature ==========
  const page4 = pages[3];
  const { height: height4 } = page4.getSize();

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Date après "Fait à AIX EN PROVENCE, le" - position ultra-précise d'après PDF signé
  page4.drawText(today, {
    x: 220,
    y: height4 - 515,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Sauvegarder le PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
