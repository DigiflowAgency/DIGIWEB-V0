# 📁 Dossier .claude - Guide d'utilisation

Ce dossier contient toute la configuration et l'historique de travail avec Claude Code.

## 📂 Structure

```
.claude/
├── README.md                      ← Ce fichier
├── CLAUDE_PRINCIPLES.md           ← Principes de travail de Claude
├── settings.local.json            ← Configuration Claude Code
├── commands/                      ← Commandes slash personnalisées
│   └── save.md                    ← Commande /save
├── hooks/                         ← Hooks automatiques
│   └── on-exit.sh                 ← Hook Ctrl+C
├── sessions/                      ← Historique des sessions
│   └── session-YYYY-MM-DD-HHmmss.md
└── logs/                          ← Logs divers (à venir)
```

## 🎯 Objectif

Maintenir un **suivi complet** de tout le développement du projet DIGIWEB ERP, avec pour but final d'atteindre **0% de données mockées** (100% backend réel).

---

## 🔧 Commandes Disponibles

### `/save` - Sauvegarder la session

Sauvegarde l'état actuel de la session dans `.claude/sessions/`.

**Usage :**
```
/save
```

**Créé automatiquement :**
- Fichier `session-YYYY-MM-DD-HHmmss.md`
- Résumé des réalisations
- Fichiers modifiés (git diff)
- Problèmes rencontrés
- État des mocks (progression)
- Prochaines étapes

**Quand l'utiliser :**
- Avant de quitter une session de dev
- Après avoir terminé une grosse feature
- Avant un commit important
- Quand vous voulez faire un point

---

## 🪝 Hooks Automatiques

### on-exit.sh (Ctrl+C)

**Trigger** : Quand vous faites Ctrl+C sur un serveur local

**Action** : Sauvegarde automatique de la session avec tag `[AUTO-SAVE]`

**Exemple :**
```bash
# Vous lancez
npm run dev

# Vous travaillez...

# Vous faites Ctrl+C
^C
🔄 Détection d'arrêt de processus - Auto-save en cours...
✅ Session sauvegardée : .claude/sessions/session-2024-11-17-151022.md
```

---

## 📋 CLAUDE_PRINCIPLES.md

Ce fichier définit **comment Claude doit travailler** sur ce projet.

### Principes clés

1. **Franchise**
   - Dire si vous avez tort
   - Proposer de meilleures alternatives
   - Ne jamais valider une mauvaise pratique

2. **Contexte**
   - Toujours lire les sessions précédentes
   - Vérifier MOCK_DATA_TRACKER.md
   - Suivre TODO_PRODUCTION.md

3. **Minimalisme**
   - Pas de sur-ingénierie
   - Uniquement ce qui est demandé
   - "Less is more"

4. **Zéro Mocks**
   - Objectif : 0% de données mockées
   - Toujours proposer l'API réelle plutôt que du mock
   - Tracker chaque suppression de mock

5. **Sécurité**
   - Auth sur toutes les routes API
   - Validation de tous les inputs
   - Pas de vulnérabilités

---

## 📊 MOCK_DATA_TRACKER.md

Fichier de tracking de **toutes les données mockées** du projet.

### Structure

- **Vue d'ensemble** : Tableau de progression global
- **Par fichier** : Liste détaillée de chaque mock
- **Plan de suppression** : Phases 1 à 6
- **Historique** : Mocks supprimés par session

### Utilisation

**Avant d'ajouter du code :**
```bash
# Vérifier ce qui reste à faire
cat MOCK_DATA_TRACKER.md | grep "❌ Mock"
```

**Après avoir supprimé un mock :**
1. Marquer comme supprimé dans le tracker
2. Mettre à jour la progression globale
3. Ajouter dans l'historique
4. Commit

---

## 📝 Sessions

Chaque session de développement est sauvegardée dans `sessions/`.

### Format du nom
```
session-YYYY-MM-DD-HHmmss.md
```

Exemple : `session-2024-11-17-105644.md`

### Contenu d'une session

```markdown
# Session du [DATE]

## ⏱️ Durée
Début/Fin

## ✅ Réalisations
Liste des tâches accomplies

## 📝 Fichiers Modifiés
git diff --stat

## 🐛 Problèmes Rencontrés
Problèmes + Solutions

## 🎯 État des Données Mockées
- Mock supprimés: X
- Mock restants: Y
- Progression: Z%

## 🔜 Prochaines Étapes
TODO prioritaires

## 💭 Notes et Décisions
Décisions architecturales
```

### Consulter l'historique

```bash
# Dernière session
ls -lt .claude/sessions/ | head -n 2

# Lire la dernière session
cat .claude/sessions/$(ls -t .claude/sessions/ | head -n 1)

# Rechercher dans toutes les sessions
grep -r "Prisma" .claude/sessions/
```

---

## 🎮 Workflow de Développement

### 1. Démarrer une session

```bash
# Lire la dernière session
cat .claude/sessions/$(ls -t .claude/sessions/ | head -n 1)

# Vérifier l'état des mocks
cat MOCK_DATA_TRACKER.md | grep "Progression"

# Consulter les TODO
cat TODO_PRODUCTION.md
```

### 2. Pendant le développement

- Claude utilise **TodoWrite** pour tracker les tâches
- Fait des commits atomiques réguliers
- Met à jour MOCK_DATA_TRACKER.md si nécessaire

### 3. Fin de session

```
Option 1 (Manuel):
Vous: /save

Option 2 (Auto):
Vous: Ctrl+C sur le serveur
→ Auto-save automatique
```

---

## 📈 Métriques de Suivi

### Par Session
- Nombre de fichiers créés/modifiés
- Lignes ajoutées/supprimées
- Mocks supprimés vs ajoutés
- Temps passé

### Global
- Progression globale : 0% → 100%
- Total mocks supprimés
- APIs créées
- Features complétées

---

## 🚀 Quick Start

### Première utilisation

1. **Lire les principes**
   ```bash
   cat .claude/CLAUDE_PRINCIPLES.md
   ```

2. **Vérifier l'état du projet**
   ```bash
   cat MOCK_DATA_TRACKER.md
   ```

3. **Consulter la dernière session**
   ```bash
   cat .claude/sessions/$(ls -t .claude/sessions/ | head -n 1)
   ```

4. **Commencer à coder** avec Claude

5. **Sauvegarder la session**
   ```
   /save
   ```

---

## 🔖 Liens Utiles

- **Principes** : `.claude/CLAUDE_PRINCIPLES.md`
- **Tracker Mocks** : `../MOCK_DATA_TRACKER.md`
- **Roadmap** : `../TODO_PRODUCTION.md`
- **Stack Technique** : `../STACK.md`
- **Guide Phase 1** : `../PHASE_1_GUIDE.md`

---

## 📞 Support

Si quelque chose ne fonctionne pas :
1. Vérifier les principes dans `CLAUDE_PRINCIPLES.md`
2. Consulter les sessions précédentes
3. Relire la dernière session pour le contexte

---

**Dernière mise à jour** : 17 novembre 2024
**Maintenu par** : Claude Code + Pierre
**Version** : 1.0
