import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer un numéro de devis unique
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({
    where: {
      number: {
        startsWith: `QU-${year}-`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `QU-${year}-${nextNumber}`;
}

async function main() {
  console.log('🌱 Seeding quotes...');

  // Récupérer les contacts et user existants
  const contacts = await prisma.contact.findMany();
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  if (contacts.length === 0) {
    console.error('❌ Aucun contact trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  // Créer des devis variés
  const quotes = [
    {
      contactId: contacts[0]?.id,
      clientName: `${contacts[0]?.firstName} ${contacts[0]?.lastName}`,
      clientEmail: contacts[0]?.email || 'client1@example.com',
      clientAddress: '123 Rue de la Paix, 75001 Paris',
      subtotal: 3750,
      taxRate: 20,
      taxAmount: 750,
      total: 4500,
      validityDays: 30,
      status: 'ENVOYE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Devis pour site web restaurant avec système de réservation',
      ownerId: user.id,
    },
    {
      contactId: contacts[1]?.id,
      clientName: `${contacts[1]?.firstName} ${contacts[1]?.lastName}`,
      clientEmail: contacts[1]?.email || 'client2@example.com',
      clientAddress: '45 Avenue des Champs-Élysées, 75008 Paris',
      subtotal: 5166.67,
      taxRate: 20,
      taxAmount: 1033.33,
      total: 6200,
      validityDays: 30,
      status: 'ACCEPTE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'E-commerce mode avec intégration paiement',
      ownerId: user.id,
    },
    {
      contactId: contacts[2]?.id,
      clientName: `${contacts[2]?.firstName} ${contacts[2]?.lastName}`,
      clientEmail: contacts[2]?.email || 'client3@example.com',
      clientAddress: '78 Boulevard Haussmann, 75009 Paris',
      subtotal: 2333.33,
      taxRate: 20,
      taxAmount: 466.67,
      total: 2800,
      validityDays: 30,
      status: 'BROUILLON' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Site vitrine pour cabinet d\'avocats',
      ownerId: user.id,
    },
    {
      contactId: contacts[3]?.id,
      clientName: `${contacts[3]?.firstName} ${contacts[3]?.lastName}`,
      clientEmail: contacts[3]?.email || 'client4@example.com',
      clientAddress: '12 Rue du Commerce, 75015 Paris',
      subtotal: 1250,
      taxRate: 20,
      taxAmount: 250,
      total: 1500,
      validityDays: 30,
      status: 'ENVOYE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Pack SEO local pour salon de coiffure',
      ownerId: user.id,
    },
    {
      contactId: contacts[4]?.id,
      clientName: `${contacts[4]?.firstName} ${contacts[4]?.lastName}`,
      clientEmail: contacts[4]?.email || 'client5@example.com',
      clientAddress: '56 Rue de Rivoli, 75004 Paris',
      subtotal: 4833.33,
      taxRate: 20,
      taxAmount: 966.67,
      total: 5800,
      validityDays: 30,
      status: 'ENVOYE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Site web + SEO pour garage automobile',
      ownerId: user.id,
    },
    {
      contactId: contacts[5]?.id,
      clientName: `${contacts[5]?.firstName} ${contacts[5]?.lastName}`,
      clientEmail: contacts[5]?.email || 'client6@example.com',
      clientAddress: '90 Rue de la République, 69002 Lyon',
      subtotal: 2666.67,
      taxRate: 20,
      taxAmount: 533.33,
      total: 3200,
      validityDays: 30,
      status: 'ACCEPTE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'E-commerce pour boulangerie traditionnelle',
      ownerId: user.id,
    },
    {
      contactId: contacts[6]?.id,
      clientName: `${contacts[6]?.firstName} ${contacts[6]?.lastName}`,
      clientEmail: contacts[6]?.email || 'client7@example.com',
      clientAddress: '23 Avenue Jean Médecin, 06000 Nice',
      subtotal: 3166.67,
      taxRate: 20,
      taxAmount: 633.33,
      total: 3800,
      validityDays: 30,
      status: 'ENVOYE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Site web pour pharmacie avec click & collect',
      ownerId: user.id,
    },
    {
      contactId: contacts[7]?.id,
      clientName: `${contacts[7]?.firstName} ${contacts[7]?.lastName}`,
      clientEmail: contacts[7]?.email || 'client8@example.com',
      clientAddress: '67 Cours Gambetta, 69003 Lyon',
      subtotal: 1833.33,
      taxRate: 20,
      taxAmount: 366.67,
      total: 2200,
      validityDays: 30,
      status: 'REFUSE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Pack marketing digital pour fleuriste',
      ownerId: user.id,
    },
    {
      contactId: contacts[0]?.id,
      clientName: `${contacts[0]?.firstName} ${contacts[0]?.lastName}`,
      clientEmail: contacts[0]?.email || 'client1@example.com',
      clientAddress: '123 Rue de la Paix, 75001 Paris',
      subtotal: 3416.67,
      taxRate: 20,
      taxAmount: 683.33,
      total: 4100,
      validityDays: 30,
      status: 'ENVOYE' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'Site restaurant bistrot avec carte en ligne',
      ownerId: user.id,
    },
    {
      contactId: contacts[1]?.id,
      clientName: `${contacts[1]?.firstName} ${contacts[1]?.lastName}`,
      clientEmail: contacts[1]?.email || 'client2@example.com',
      clientAddress: '45 Avenue des Champs-Élysées, 75008 Paris',
      subtotal: 2416.67,
      taxRate: 20,
      taxAmount: 483.33,
      total: 2900,
      validityDays: 30,
      status: 'BROUILLON' as const,
      paymentTerms: 'Paiement à 30 jours',
      notes: 'SEO + Google Ads pour librairie',
      ownerId: user.id,
    },
  ];

  // Calculer les dates d'expiration
  const now = new Date();
  const quotesWithDates = quotes.map((quote, index) => {
    const createdAt = new Date(now.getTime() - (quotes.length - index) * 2 * 24 * 60 * 60 * 1000);
    const expiresAt = new Date(createdAt.getTime() + quote.validityDays * 24 * 60 * 60 * 1000);
    return {
      ...quote,
      createdAt,
      expiresAt,
    };
  });

  for (const quoteData of quotesWithDates) {
    const number = await generateQuoteNumber();
    await prisma.quote.create({ data: { ...quoteData, number } });
  }

  console.log(`✅ ${quotesWithDates.length} devis créés avec succès`);

  // Afficher les stats
  const brouillon = quotesWithDates.filter(q => q.status === 'BROUILLON').length;
  const envoye = quotesWithDates.filter(q => q.status === 'ENVOYE').length;
  const accepte = quotesWithDates.filter(q => q.status === 'ACCEPTE').length;
  const refuse = quotesWithDates.filter(q => q.status === 'REFUSE').length;
  const totalValue = quotesWithDates.reduce((sum, q) => sum + q.total, 0);

  console.log(`📊 Brouillon: ${brouillon}, Envoyé: ${envoye}, Accepté: ${accepte}, Refusé: ${refuse}`);
  console.log(`💰 Valeur totale: ${totalValue.toLocaleString()}€`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
