/**
 * Script de migration pour convertir les données existantes
 * productionServiceId/productionStageId -> deal_service_assignments
 *
 * Usage: npx ts-node prisma/scripts/migrate-service-assignments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Début de la migration des services de production...\n');

  // Trouver tous les deals qui ont un productionServiceId
  const dealsWithService = await prisma.deals.findMany({
    where: {
      productionServiceId: { not: null }
    },
    select: {
      id: true,
      title: true,
      productionServiceId: true,
      productionStageId: true,
    }
  });

  console.log(`📊 ${dealsWithService.length} deal(s) à migrer\n`);

  if (dealsWithService.length === 0) {
    console.log('✅ Aucun deal à migrer, la base est déjà propre.');
    return;
  }

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const deal of dealsWithService) {
    try {
      // Vérifier si l'assignation existe déjà
      const existing = await prisma.deal_service_assignments.findUnique({
        where: {
          dealId_serviceId: {
            dealId: deal.id,
            serviceId: deal.productionServiceId!,
          }
        }
      });

      if (existing) {
        console.log(`⏭️  Deal "${deal.title}" (${deal.id}) - Assignation déjà existante, ignoré`);
        skipped++;
        continue;
      }

      // Créer l'assignation dans la nouvelle table
      await prisma.deal_service_assignments.create({
        data: {
          dealId: deal.id,
          serviceId: deal.productionServiceId!,
          stageId: deal.productionStageId,
        }
      });

      console.log(`✅ Deal "${deal.title}" (${deal.id}) migré avec succès`);
      migrated++;
    } catch (error) {
      console.error(`❌ Erreur pour deal "${deal.title}" (${deal.id}):`, error);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 Résumé de la migration:');
  console.log(`   ✅ Migrés: ${migrated}`);
  console.log(`   ⏭️  Ignorés (déjà existants): ${skipped}`);
  console.log(`   ❌ Erreurs: ${errors}`);
  console.log('='.repeat(50));
  console.log('\n🎉 Migration terminée!');
}

main()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
