-- Migration: Ajout du stage NRP (Ne Répond Pas)
-- Position: Après A_RELANCER (position 3) -> NRP sera position 4

-- D'abord, décaler les positions des stages après A_RELANCER
UPDATE pipeline_stages SET position = position + 1 WHERE position >= 4;

-- Insérer le nouveau stage NRP
INSERT INTO pipeline_stages (id, code, label, color, probability, position, isDefault, isWonStage, isLostStage, isActive, createdAt, updatedAt)
VALUES (
  CONCAT('clnrp', UNIX_TIMESTAMP(), LPAD(FLOOR(RAND() * 1000), 3, '0')),
  'NRP',
  'Ne Répond Pas',
  'bg-orange-50 border-orange-300',
  5,
  4,
  false,
  false,
  false,
  true,
  NOW(),
  NOW()
);
