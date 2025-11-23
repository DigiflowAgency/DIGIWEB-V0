import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding knowledge articles...');

  const articlesData = [
    { title: 'Comment créer une campagne email', category: 'Marketing', content: 'Guide complet pour créer et gérer vos campagnes email marketing...', views: 245 },
    { title: 'Guide SEO pour débutants', category: 'SEO', content: 'Apprenez les bases du référencement naturel...', views: 892 },
    { title: 'Configurer votre dashboard', category: 'Aide', content: 'Personnalisez votre tableau de bord...', views: 456 },
    { title: 'Optimiser votre site web', category: 'SEO', content: 'Techniques d\'optimisation pour améliorer les performances...', views: 623 },
    { title: 'Gérer les contacts CRM', category: 'CRM', content: 'Comment organiser et gérer efficacement vos contacts...', views: 334 },
    { title: 'Créer des rapports personnalisés', category: 'Analytics', content: 'Générez des rapports adaptés à vos besoins...', views: 289 },
    { title: 'FAQ Facturation', category: 'Aide', content: 'Questions fréquentes sur la facturation...', views: 512 },
    { title: 'Intégrations tierces', category: 'Technique', content: 'Connectez vos outils préférés...', views: 178 },
    { title: 'Best practices réseaux sociaux', category: 'Marketing', content: 'Optimisez votre présence sur les réseaux sociaux...', views: 445 },
    { title: 'Sécurité et confidentialité', category: 'Aide', content: 'Protégez vos données et celles de vos clients...', views: 367 },
  ];

  let created = 0;
  for (const articleData of articlesData) {
    await prisma.knowledge_articles.create({ data: articleData as any });
    created++;
  }

  console.log(`✅ ${created} articles créés`);
  console.log(`📊 Total vues: ${articlesData.reduce((sum, a) => sum + a.views, 0)}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
