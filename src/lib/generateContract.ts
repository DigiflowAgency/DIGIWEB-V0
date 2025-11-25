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

export async function generateContract(quoteData: QuoteData): Promise<Buffer> {
  // Charger le template PDF
  const templatePath = path.join(process.cwd(), 'TRAME CONTRAT SITE DIGIFLOW.pdf');
  const templateBytes = await fs.readFile(templatePath);

  // Charger le PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();

  // Charger la police
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1 - Informations du client (après "Et")
  const page1 = pages[0];
  const { height } = page1.getSize();

  // Informations client (section "Et")
  let yPosition = height - 350; // Position approximative après "Et"

  page1.drawText(quoteData.clientName.toUpperCase(), {
    x: 50,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 20;

  if (quoteData.clientSiret) {
    page1.drawText(quoteData.clientSiret, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  }

  if (quoteData.clientAddress) {
    page1.drawText(quoteData.clientAddress, {
      x: 50,
      y: yPosition,
      size: 11,
      font: font,
      color: rgb(0, 0, 0),
    });
  }

  // Période d'engagement (Article 2)
  const commitmentMonths = quoteData.commitmentPeriod && quoteData.commitmentPeriod !== 'comptant'
    ? parseInt(quoteData.commitmentPeriod)
    : 0;

  const commitmentText = commitmentMonths > 0 ? `${commitmentMonths} MOIS` : 'Sans engagement';

  // Cette position devra être ajustée selon le template
  page1.drawText(commitmentText, {
    x: 480,
    y: height - 580, // Position approximative dans l'Article 2
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Page 3 - Liste des prestations (Article 5)
  const page3 = pages[2];
  const { height: height3 } = page3.getSize();

  let prestationY = height3 - 200; // Position de départ pour les prestations

  quoteData.quote_products?.forEach((product) => {
    const priceFormatted = `${Math.round(product.totalPrice).toLocaleString('fr-FR')}€`;
    const period = product.period && product.period !== 'paiement unique' ? `/${product.period}` : '';
    const line = `${product.name}`;
    const priceLine = `${priceFormatted}${period}`;

    // Nom du produit
    page3.drawText(line, {
      x: 50,
      y: prestationY,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
      maxWidth: 400,
    });

    // Prix à droite
    page3.drawText(priceLine, {
      x: 480,
      y: prestationY,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    prestationY -= 60; // Espace entre les prestations
  });

  // Bas de page 3 - Montants totaux et modalités
  const totalLine = `${Math.round(quoteData.subtotal).toLocaleString('fr-FR')}€ -> 0€ (offert partenaire)`;
  const monthlyPayment = commitmentMonths > 0
    ? `${Math.round(quoteData.subtotal / commitmentMonths)}€/mois (Reste à charge)`
    : '0€';
  const duration = commitmentMonths > 0 ? `${commitmentMonths} mois` : 'Comptant';

  page3.drawText(totalLine, {
    x: 50,
    y: 100, // Position en bas de page
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page3.drawText(monthlyPayment, {
    x: 400,
    y: 100,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  page3.drawText(duration, {
    x: 500,
    y: 100,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Page 4 - Date de signature
  const page4 = pages[3];
  const { height: height4 } = page4.getSize();

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  page4.drawText(today, {
    x: 280,
    y: height4 - 520, // Position après "Fait à AIX EN PROVENCE, le"
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });

  // Sauvegarder le PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
