import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding products...');

  const products = [
    {
      name: 'Site Vitrine Pro',
      category: 'Web',
      description: 'Site web professionnel pour votre entreprise',
      price: 2990,
      monthlyPrice: 99,
      features: [
        'Design responsive moderne',
        '5 pages personnalisées',
        'Hébergement 1 an inclus',
        'Nom de domaine offert',
        'Formulaire de contact',
        'Optimisation SEO basique',
      ],
      popular: true,
    },
    {
      name: 'Pack SEO Elite',
      category: 'Marketing',
      description: 'Boostez votre visibilité Google',
      price: 1500,
      monthlyPrice: 250,
      features: [
        'Audit SEO complet',
        'Optimisation technique',
        '10 articles SEO/mois',
        'Netlinking qualité',
        'Suivi positions',
        'Rapport mensuel détaillé',
      ],
      popular: false,
    },
    {
      name: 'E-commerce Startup',
      category: 'Web',
      description: 'Boutique en ligne clé en main',
      price: 4500,
      monthlyPrice: 149,
      features: [
        'Catalogue produits illimité',
        'Paiement sécurisé Stripe',
        'Gestion stocks automatique',
        'Application mobile PWA',
        'Support prioritaire 7j/7',
        'Formation complète incluse',
      ],
      popular: true,
    },
    {
      name: 'Pack Social Media',
      category: 'Marketing',
      description: 'Gérez vos réseaux sociaux efficacement',
      price: 800,
      monthlyPrice: 200,
      features: [
        '20 posts/mois multi-plateformes',
        'Création graphique pro',
        'Community management',
        'Statistiques mensuelles',
        'Campagnes publicitaires',
        'Stratégie de contenu',
      ],
      popular: false,
    },
    {
      name: 'Refonte Premium',
      category: 'Web',
      description: 'Modernisez votre site existant',
      price: 3500,
      monthlyPrice: null,
      features: [
        'Audit UX complet',
        'Nouveau design moderne',
        'Migration de contenu',
        'Optimisation performances',
        'Formation équipe',
        'Garantie 2 ans',
      ],
      popular: false,
    },
    {
      name: 'Application Web',
      category: 'Web',
      description: 'Développement sur-mesure',
      price: 8900,
      monthlyPrice: 299,
      features: [
        'Développement sur-mesure',
        'Architecture scalable',
        'API REST & GraphQL',
        'Dashboard admin complet',
        'Intégrations illimitées',
        'Support technique dédié',
      ],
      popular: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  const count = await prisma.product.count();
  console.log(`✅ ${count} produits créés avec succès!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
