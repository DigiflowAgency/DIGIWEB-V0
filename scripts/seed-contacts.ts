import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding contacts...');

  // Vérifier qu'un utilisateur existe pour assignation
  let user = await prisma.users.findFirst();

  if (!user) {
    console.log('Création d\'un utilisateur pour assigner les contacts...');
    const hashedPassword = await bcrypt.hash('Demo2024!', 10);
    user = await prisma.users.create({
      data: {
        email: 'alex@digiweb.fr',
        password: hashedPassword,
        firstName: 'Alexandre',
        lastName: 'Martin',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
      } as any,
    });
  }

  // Créer quelques entreprises
  const company1 = await prisma.companies.create({
    data: {
      name: 'TechCorp France',
      siret: '12345678900123',
      status: 'CLIENT' as const,
      address: '15 Rue du Commerce',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
    } as any,
  });

  const company2 = await prisma.companies.create({
    data: {
      name: 'Solutions Digitales',
      siret: '98765432100456',
      status: 'PROSPECT' as const,
      address: '42 Avenue des Entrepreneurs',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France',
    } as any,
  });

  const company3 = await prisma.companies.create({
    data: {
      name: 'Innovation Web',
      siret: '55544433322211',
      status: 'LEAD' as const,
      address: '8 Boulevard de la Tech',
      city: 'Toulouse',
      postalCode: '31000',
      country: 'France',
    } as any,
  });

  // Créer des contacts
  const contacts = [
    {
      firstName: 'Sophie',
      lastName: 'Dubois',
      email: 'sophie.dubois@techcorp.fr',
      phone: '+33 6 12 34 56 78',
      position: 'Directrice Générale',
      status: 'CLIENT' as const,
      qualityScore: 95,
      city: 'Paris',
      companyId: company1.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Pierre',
      lastName: 'Lefebvre',
      email: 'pierre.lefebvre@techcorp.fr',
      phone: '+33 6 23 45 67 89',
      position: 'Directeur Technique',
      status: 'CLIENT' as const,
      qualityScore: 90,
      city: 'Paris',
      companyId: company1.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Marie',
      lastName: 'Bernard',
      email: 'marie.bernard@solutions-digitales.fr',
      phone: '+33 6 34 56 78 90',
      position: 'Chef de Projet',
      status: 'PROSPECT' as const,
      qualityScore: 85,
      city: 'Lyon',
      companyId: company2.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Thomas',
      lastName: 'Petit',
      email: 'thomas.petit@solutions-digitales.fr',
      phone: '+33 6 45 67 89 01',
      position: 'Responsable Commercial',
      status: 'PROSPECT' as const,
      qualityScore: 80,
      city: 'Lyon',
      companyId: company2.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Julie',
      lastName: 'Moreau',
      email: 'julie.moreau@innovation-web.fr',
      phone: '+33 6 56 78 90 12',
      position: 'CEO',
      status: 'LEAD' as const,
      qualityScore: 75,
      city: 'Toulouse',
      companyId: company3.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Nicolas',
      lastName: 'Girard',
      email: 'nicolas.girard@innovation-web.fr',
      phone: '+33 6 67 89 01 23',
      position: 'CTO',
      status: 'LEAD' as const,
      qualityScore: 70,
      city: 'Toulouse',
      companyId: company3.id,
      assignedToId: user.id,
    },
    {
      firstName: 'Isabelle',
      lastName: 'Roux',
      email: 'isabelle.roux@freelance.fr',
      phone: '+33 6 78 90 12 34',
      position: 'Consultante Indépendante',
      status: 'LEAD' as const,
      qualityScore: 65,
      city: 'Marseille',
      assignedToId: user.id,
    },
    {
      firstName: 'Laurent',
      lastName: 'Simon',
      email: 'laurent.simon@startup.com',
      phone: '+33 6 89 01 23 45',
      position: 'Fondateur',
      status: 'LEAD' as const,
      qualityScore: 60,
      city: 'Nantes',
      assignedToId: user.id,
    },
  ];

  for (const contactData of contacts) {
    await prisma.contacts.create({ data: contactData as any });
  }

  console.log(`✅ ${contacts.length} contacts créés avec succès`);
  console.log(`✅ 3 entreprises créées avec succès`);
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
