-- AlterTable: Ajouter le champ encaisseAt
ALTER TABLE `deals` ADD COLUMN `encaisseAt` DATETIME(3) NULL;

-- Remplir encaisseAt avec updatedAt pour les deals déjà en ENCAISSE
UPDATE `deals` SET `encaisseAt` = `updatedAt` WHERE `productionStage` = 'ENCAISSE';
