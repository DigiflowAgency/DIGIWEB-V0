const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestLead() {
  try {
    console.log('🚀 Création d\'un lead de test...\n');

    // 1. Créer l'entreprise
    const company = await prisma.companies.create({
      data: {
        id: `company_${Date.now()}`,
        name: 'Test Digital Agency',
        city: 'Lyon',
        siret: '12345678900001',
        website: 'https://test-agency.fr',
        socialMedia: JSON.stringify({ instagram: '@testagency' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Entreprise créée:', company.name);

    // 2. Créer le contact
    const contact = await prisma.contacts.create({
      data: {
        id: `contact_${Date.now()}`,
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@test-agency.fr',
        phone: '0612345678',
        companyId: company.id,
        status: 'LEAD',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Contact créé:', `${contact.firstName} ${contact.lastName}`);

    // Trouver un utilisateur pour assigner le deal
    const user = await prisma.users.findFirst();
    if (!user) {
      throw new Error('Aucun utilisateur trouvé dans la base');
    }

    // 3. Créer le deal
    const deal = await prisma.deals.create({
      data: {
        id: `deal_${Date.now()}`,
        title: company.name,
        description: 'Site web vitrine + SEO',
        value: 5000,
        currency: 'EUR',
        stage: 'A_CONTACTER',
        probability: 10,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        contactId: contact.id,
        companyId: company.id,
        ownerId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✅ Deal créé:', deal.title, `- ${deal.value}€`);

    // Récupérer le deal complet avec relations
    const fullDeal = await prisma.deals.findUnique({
      where: { id: deal.id },
      include: {
        contact: true,
        company: true,
        users: true,
      },
    });

    console.log('\n📊 Lead créé avec succès!\n');
    console.log('Contact:', `${fullDeal.contact.firstName} ${fullDeal.contact.lastName} (${fullDeal.contact.phone})`);
    console.log('Entreprise:', `${fullDeal.company.name} - ${fullDeal.company.city}`);
    console.log('Deal:', `${fullDeal.title} - ${fullDeal.value}€ - Stage: ${fullDeal.stage}`);
    console.log('Assigné à:', `${fullDeal.users.firstName} ${fullDeal.users.lastName}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestLead();
