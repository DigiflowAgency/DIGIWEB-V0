import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction pour générer un numéro de facture unique
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoices.count({
    where: {
      number: {
        startsWith: `FA-${year}-`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `FA-${year}-${nextNumber}`;
}

async function main() {
  console.log('🌱 Seeding invoices...');

  // Récupérer les contacts et user existants
  const contacts = await prisma.contacts.findMany();
  const user = await prisma.users.findFirst();

  if (!user) {
    console.error('❌ Aucun utilisateur trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  if (contacts.length === 0) {
    console.error('❌ Aucun contact trouvé. Exécutez seed-contacts.ts d\'abord.');
    return;
  }

  // Créer des factures variées
  const now = new Date();
  const invoices = [
    {
      clientName: `${contacts[0]?.firstName} ${contacts[0]?.lastName}`,
      clientEmail: contacts[0]?.email || 'client1@example.com',
      clientAddress: '123 Rue de la Paix, 75001 Paris',
      subtotal: 3750,
      taxRate: 20,
      taxAmount: 750,
      total: 4500,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 15),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 10),
      paymentMethod: 'Virement bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[1]?.firstName} ${contacts[1]?.lastName}`,
      clientEmail: contacts[1]?.email || 'client2@example.com',
      clientAddress: '45 Avenue des Champs-Élysées, 75008 Paris',
      subtotal: 5166.67,
      taxRate: 20,
      taxAmount: 1033.33,
      total: 6200,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 20),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 18),
      paymentMethod: 'Carte bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[2]?.firstName} ${contacts[2]?.lastName}`,
      clientEmail: contacts[2]?.email || 'client3@example.com',
      clientAddress: '78 Boulevard Haussmann, 75009 Paris',
      subtotal: 2333.33,
      taxRate: 20,
      taxAmount: 466.67,
      total: 2800,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 10),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 25),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[3]?.firstName} ${contacts[3]?.lastName}`,
      clientEmail: contacts[3]?.email || 'client4@example.com',
      clientAddress: '12 Rue du Commerce, 75015 Paris',
      subtotal: 1250,
      taxRate: 20,
      taxAmount: 250,
      total: 1500,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 18),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 18),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 16),
      paymentMethod: 'Virement bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[4]?.firstName} ${contacts[4]?.lastName}`,
      clientEmail: contacts[4]?.email || 'client5@example.com',
      clientAddress: '56 Rue de Rivoli, 75004 Paris',
      subtotal: 4833.33,
      taxRate: 20,
      taxAmount: 966.67,
      total: 5800,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 15),
      dueAt: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[5]?.firstName} ${contacts[5]?.lastName}`,
      clientEmail: contacts[5]?.email || 'client6@example.com',
      clientAddress: '90 Rue de la République, 69002 Lyon',
      subtotal: 2666.67,
      taxRate: 20,
      taxAmount: 533.33,
      total: 3200,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 10),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 10),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 8),
      paymentMethod: 'Virement bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[6]?.firstName} ${contacts[6]?.lastName}`,
      clientEmail: contacts[6]?.email || 'client7@example.com',
      clientAddress: '23 Avenue Jean Médecin, 06000 Nice',
      subtotal: 3166.67,
      taxRate: 20,
      taxAmount: 633.33,
      total: 3800,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 13),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 28),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[7]?.firstName} ${contacts[7]?.lastName}`,
      clientEmail: contacts[7]?.email || 'client8@example.com',
      clientAddress: '67 Cours Gambetta, 69003 Lyon',
      subtotal: 1833.33,
      taxRate: 20,
      taxAmount: 366.67,
      total: 2200,
      status: 'EN_RETARD' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 5),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 5),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[0]?.firstName} ${contacts[0]?.lastName}`,
      clientEmail: contacts[0]?.email || 'client1@example.com',
      clientAddress: '123 Rue de la Paix, 75001 Paris',
      subtotal: 3416.67,
      taxRate: 20,
      taxAmount: 683.33,
      total: 4100,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 22),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 22),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 20),
      paymentMethod: 'Carte bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[1]?.firstName} ${contacts[1]?.lastName}`,
      clientEmail: contacts[1]?.email || 'client2@example.com',
      clientAddress: '45 Avenue des Champs-Élysées, 75008 Paris',
      subtotal: 2416.67,
      taxRate: 20,
      taxAmount: 483.33,
      total: 2900,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 16),
      dueAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[2]?.firstName} ${contacts[2]?.lastName}`,
      clientEmail: contacts[2]?.email || 'client3@example.com',
      clientAddress: '78 Boulevard Haussmann, 75009 Paris',
      subtotal: 4000,
      taxRate: 20,
      taxAmount: 800,
      total: 4800,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 12),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 10),
      paymentMethod: 'Virement bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[3]?.firstName} ${contacts[3]?.lastName}`,
      clientEmail: contacts[3]?.email || 'client4@example.com',
      clientAddress: '12 Rue du Commerce, 75015 Paris',
      subtotal: 2083.33,
      taxRate: 20,
      taxAmount: 416.67,
      total: 2500,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 12),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 27),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[4]?.firstName} ${contacts[4]?.lastName}`,
      clientEmail: contacts[4]?.email || 'client5@example.com',
      clientAddress: '56 Rue de Rivoli, 75004 Paris',
      subtotal: 7416.67,
      taxRate: 20,
      taxAmount: 1483.33,
      total: 8900,
      status: 'PAYEE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 8),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 8),
      paidAt: new Date(now.getFullYear(), now.getMonth(), 5),
      paymentMethod: 'Virement bancaire',
      ownerId: user.id,
    },
    {
      clientName: `${contacts[5]?.firstName} ${contacts[5]?.lastName}`,
      clientEmail: contacts[5]?.email || 'client6@example.com',
      clientAddress: '90 Rue de la République, 69002 Lyon',
      subtotal: 3000,
      taxRate: 20,
      taxAmount: 600,
      total: 3600,
      status: 'EN_ATTENTE' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth(), 14),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 29),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
    {
      clientName: `${contacts[6]?.firstName} ${contacts[6]?.lastName}`,
      clientEmail: contacts[6]?.email || 'client7@example.com',
      clientAddress: '23 Avenue Jean Médecin, 06000 Nice',
      subtotal: 4333.33,
      taxRate: 20,
      taxAmount: 866.67,
      total: 5200,
      status: 'EN_RETARD' as const,
      issuedAt: new Date(now.getFullYear(), now.getMonth() - 1, 12),
      dueAt: new Date(now.getFullYear(), now.getMonth(), 12),
      paidAt: null,
      paymentMethod: null,
      ownerId: user.id,
    },
  ];

  for (const invoiceData of invoices) {
    const number = await generateInvoiceNumber();
    await prisma.invoices.create({ data: { ...invoiceData, number } as any });
  }

  console.log(`✅ ${invoices.length} factures créées avec succès`);

  // Afficher les stats
  const paye = invoices.filter(i => i.status === 'PAYEE').length;
  const envoye = invoices.filter(i => i.status === 'EN_ATTENTE').length;
  const enRetard = invoices.filter(i => i.status === 'EN_RETARD').length;
  const totalValue = invoices.reduce((sum, i) => sum + i.total, 0);
  const totalPaid = invoices.filter(i => i.status === 'PAYEE').reduce((sum, i) => sum + i.total, 0);
  const totalUnpaid = invoices.filter(i => i.status === 'EN_ATTENTE' || i.status === 'EN_RETARD').reduce((sum, i) => sum + i.total, 0);

  console.log(`📊 Payées: ${paye}, En attente: ${envoye}, En retard: ${enRetard}`);
  console.log(`💰 Valeur totale: ${totalValue.toLocaleString()}€`);
  console.log(`💚 Payé: ${totalPaid.toLocaleString()}€`);
  console.log(`💛 Impayé: ${totalUnpaid.toLocaleString()}€`);
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
