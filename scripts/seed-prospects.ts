import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding prospects...');

  const prospectsData = [
    {
      name: 'Restaurant La Table Gourmande',
      activity: 'Restaurant',
      address: '15 Rue de la Paix',
      city: 'Paris',
      phone: '01 42 33 44 55',
      email: 'contact@tablegourmande.fr',
      website: 'www.tablegourmande.fr',
      employees: '10-20',
      rating: 4.5,
    },
    {
      name: 'Boulangerie Artisanale du Centre',
      activity: 'Boulangerie',
      address: '28 Avenue Victor Hugo',
      city: 'Paris',
      phone: '01 43 22 11 00',
      email: 'info@boulangeriecentre.fr',
      website: null,
      employees: '5-10',
      rating: 4.8,
    },
    {
      name: 'Coiffure Moderne Style',
      activity: 'Salon de coiffure',
      address: '42 Boulevard Haussmann',
      city: 'Paris',
      phone: '01 44 55 66 77',
      email: 'rdv@coiffurestyle.fr',
      website: 'www.coiffurestyle.fr',
      employees: '3-5',
      rating: 4.3,
    },
    {
      name: 'Garage Auto Service Plus',
      activity: 'Garage automobile',
      address: '89 Route de la Liberation',
      city: 'Paris',
      phone: '01 45 77 88 99',
      email: 'contact@autoserviceplus.fr',
      website: null,
      employees: '10-20',
      rating: 4.1,
    },
    {
      name: 'Bijouterie Prestige',
      activity: 'Bijouterie',
      address: '7 Place Vendôme',
      city: 'Paris',
      phone: '01 46 88 99 00',
      email: 'info@bijouxprestige.fr',
      website: 'www.bijouxprestige.fr',
      employees: '5-10',
      rating: 4.9,
    },
    {
      name: 'Cabinet Dentaire Sourire',
      activity: 'Cabinet dentaire',
      address: '33 Rue du Faubourg',
      city: 'Paris',
      phone: '01 47 11 22 33',
      email: 'rdv@cabinetdentaire.fr',
      website: 'www.dentisteparis.fr',
      employees: '5-10',
      rating: 4.6,
    },
    {
      name: 'Fleuriste Le Jardin Enchanté',
      activity: 'Fleuriste',
      address: '18 Rue des Roses',
      city: 'Paris',
      phone: '01 48 33 44 55',
      email: 'contact@jardinenchante.fr',
      website: null,
      employees: '1-3',
      rating: 4.7,
    },
    {
      name: 'Pharmacie Centrale',
      activity: 'Pharmacie',
      address: '55 Boulevard Saint-Michel',
      city: 'Paris',
      phone: '01 49 55 66 77',
      email: 'pharmacie@centrale.fr',
      website: 'www.pharmaciecentrale.fr',
      employees: '5-10',
      rating: 4.4,
    },
    {
      name: 'Pizzeria Bella Napoli',
      activity: 'Restaurant',
      address: '22 Avenue des Champs',
      city: 'Lyon',
      phone: '04 72 11 22 33',
      email: 'contact@bellanapoli.fr',
      website: 'www.bellanapoli-lyon.fr',
      employees: '10-20',
      rating: 4.6,
    },
    {
      name: 'Salle de Sport FitnessPro',
      activity: 'Salle de sport',
      address: '88 Rue de la République',
      city: 'Lyon',
      phone: '04 72 33 44 55',
      email: 'info@fitnesspro.fr',
      website: 'www.fitnesspro-lyon.fr',
      employees: '20-50',
      rating: 4.2,
    },
    {
      name: 'Librairie du Vieux Port',
      activity: 'Librairie',
      address: '12 Quai du Port',
      city: 'Marseille',
      phone: '04 91 22 33 44',
      email: 'contact@librairie-vieuxport.fr',
      website: null,
      employees: '3-5',
      rating: 4.5,
    },
    {
      name: 'Agence Immobilière Horizon',
      activity: 'Immobilier',
      address: '45 Boulevard Longchamp',
      city: 'Marseille',
      phone: '04 91 55 66 77',
      email: 'contact@agence-horizon.fr',
      website: 'www.agence-horizon-marseille.fr',
      employees: '10-20',
      rating: 4.0,
    },
  ];

  let created = 0;
  for (const prospectData of prospectsData) {
    await prisma.prospects.create({
      data: prospectData as any,
    });
    created++;
  }

  console.log(`✅ ${created} prospects créés avec succès`);

  // Afficher des stats
  const stats = {
    total: created,
    paris: prospectsData.filter((p) => p.city === 'Paris').length,
    lyon: prospectsData.filter((p) => p.city === 'Lyon').length,
    marseille: prospectsData.filter((p) => p.city === 'Marseille').length,
    withWebsite: prospectsData.filter((p) => p.website).length,
    avgRating: (
      prospectsData.reduce((sum, p) => sum + p.rating, 0) / prospectsData.length
    ).toFixed(1),
  };

  console.log('\n📊 Statistiques:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   \n   Par ville:`);
  console.log(`   - Paris: ${stats.paris}`);
  console.log(`   - Lyon: ${stats.lyon}`);
  console.log(`   - Marseille: ${stats.marseille}`);
  console.log(`   \n   Avec site web: ${stats.withWebsite}/${stats.total}`);
  console.log(`   Note moyenne: ${stats.avgRating}/5`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
