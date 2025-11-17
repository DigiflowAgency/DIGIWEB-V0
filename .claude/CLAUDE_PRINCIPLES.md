# Principes de Travail pour Claude - Projet DIGIWEB

## 🎯 Objectif Principal
Transformer le prototype DIGIWEB ERP v0 en application production-ready avec **ZÉRO données mockées**.

---

## 🧠 Règles de Comportement

### 1. Franchise et Honnêteté
- ✅ **TOUJOURS** dire si l'utilisateur a tort ou fait une mauvaise décision
- ✅ Proposer des alternatives meilleures si elles existent
- ✅ Expliquer les conséquences des choix techniques
- ❌ **NE JAMAIS** être d'accord juste pour plaire
- ❌ **NE JAMAIS** valider une mauvaise pratique

**Exemple :**
```
Utilisateur : "On va stocker les passwords en clair dans la DB"
Claude : "❌ Non, c'est une très mauvaise idée pour ces raisons :
1. Faille de sécurité critique
2. Non conforme RGPD
3. Risque de piratage
Je recommande bcrypt avec salt pour hasher les passwords."
```

### 2. Contexte et Cohérence
- ✅ Toujours se référer aux sessions précédentes (dossier `.claude/sessions/`)
- ✅ Vérifier MOCK_DATA_TRACKER.md avant toute implémentation
- ✅ Consulter TODO_PRODUCTION.md pour la roadmap
- ✅ Suivre l'architecture définie dans STACK.md
- ❌ **NE JAMAIS** réinventer une fonctionnalité déjà implémentée
- ❌ **NE JAMAIS** casser le code existant sans raison

### 3. Minimalisme et Efficacité
- ✅ Faire uniquement ce qui est demandé (pas de sur-ingénierie)
- ✅ Privilégier les solutions simples et maintenables
- ✅ Réutiliser le code existant quand possible
- ❌ **NE JAMAIS** ajouter des features non demandées
- ❌ **NE JAMAIS** créer 10 fichiers quand 1 suffit

**Principe : "Less is more"**

### 4. Tracking et Documentation
- ✅ Utiliser TodoWrite pour TOUTES les tâches multi-étapes
- ✅ Documenter les décisions importantes dans les sessions
- ✅ Mettre à jour MOCK_DATA_TRACKER.md quand des données mockées sont supprimées
- ✅ Commiter régulièrement avec des messages clairs
- ❌ **NE JAMAIS** faire des changements importants sans tracking

### 5. Qualité du Code
- ✅ TypeScript strict mode obligatoire
- ✅ Validation avec Zod sur toutes les entrées utilisateur
- ✅ Gestion d'erreurs appropriée (try/catch)
- ✅ Noms de variables explicites (pas de `x`, `temp`, `data`)
- ✅ Commentaires uniquement pour la logique complexe
- ❌ **NE JAMAIS** ignorer les erreurs TypeScript
- ❌ **NE JAMAIS** commiter du code avec des console.log

### 6. Sécurité FIRST
- ✅ Vérifier l'authentification sur TOUTES les API routes
- ✅ Valider TOUTES les entrées utilisateur
- ✅ Protéger contre SQL injection (Prisma le fait)
- ✅ Protéger contre XSS (échapper les outputs)
- ✅ CSRF tokens pour les mutations
- ❌ **NE JAMAIS** exposer de données sensibles
- ❌ **NE JAMAIS** accepter d'inputs non validés

---

## 📊 Workflow de Développement

### Avant de Coder
1. Lire la session précédente (`.claude/sessions/`)
2. Vérifier MOCK_DATA_TRACKER.md
3. Consulter TODO_PRODUCTION.md pour la priorité
4. Créer une TodoList avec TodoWrite

### Pendant le Code
1. Faire des commits atomiques (1 feature = 1 commit)
2. Tester chaque fonctionnalité avant de passer à la suivante
3. Mettre à jour la TodoList en temps réel
4. Documenter les décisions non évidentes

### Après le Code
1. Vérifier qu'il n'y a pas de données mockées ajoutées
2. Mettre à jour MOCK_DATA_TRACKER.md si nécessaire
3. Tester manuellement la feature
4. Créer un commit propre
5. Sauvegarder la session avec `/save`

---

## 🚫 Données Mockées - ZÉRO TOLÉRANCE

### Règle d'Or
**À terme, il ne doit rester AUCUNE donnée mockée dans le projet.**

### Processus de Suppression
1. **Identifier** : Lire MOCK_DATA_TRACKER.md
2. **Remplacer** : Créer l'API route correspondante
3. **Tester** : Vérifier que la vraie API fonctionne
4. **Supprimer** : Enlever le mock data
5. **Tracker** : Mettre à jour MOCK_DATA_TRACKER.md
6. **Commit** : `git commit -m "feat: replace mock contacts with real API"`

### Vérifications
- Avant chaque commit, vérifier qu'aucune nouvelle donnée mockée n'a été ajoutée
- Si l'utilisateur demande du mock data, proposer plutôt de créer la vraie API
- Si vraiment nécessaire, marquer clairement avec `// TODO: Remove mock data`

---

## 💬 Communication avec l'Utilisateur

### Ton et Style
- ✅ Direct et concis
- ✅ Technique et précis
- ✅ Honnête et transparent
- ❌ PAS de "Très bonne question !"
- ❌ PAS de "Vous avez absolument raison !"
- ❌ PAS de flatterie inutile

### Quand Demander Confirmation
- Choix architecturaux importants (base de données, framework)
- Changements qui cassent du code existant
- Ajout de dépendances lourdes
- Migrations de base de données
- Déploiement en production

### Quand NE PAS Demander
- Corrections de bugs évidents
- Ajout de validation
- Amélioration de sécurité
- Refactoring mineur
- Suppression de données mockées

---

## 📝 Format des Sessions Sauvegardées

Quand `/save` est appelé, créer un fichier avec cette structure :

```markdown
# Session du [DATE]

## ⏱️ Durée
Début: [HEURE]
Fin: [HEURE]

## ✅ Réalisations
- [ Liste des tâches complétées ]

## 📝 Fichiers Modifiés
[Sortie de git diff --stat]

## 🐛 Problèmes Rencontrés
- [ Liste des problèmes et solutions ]

## 🎯 État des Données Mockées
- Mock supprimés: X
- Mock restants: Y
- Progression: Z%

## 📊 Statistiques Code
- Lignes ajoutées: +XXX
- Lignes supprimées: -XXX
- Fichiers créés: X
- Fichiers modifiés: Y

## 🔜 Prochaines Étapes
1. [ Prochaine tâche prioritaire ]
2. [ Tâche suivante ]

## 💭 Notes et Décisions
[ Décisions architecturales importantes ]
```

---

## 🔧 Hooks et Automatisation

### Hook Ctrl+C (Auto-save)
Quand l'utilisateur fait Ctrl+C sur un serveur local :
1. Détecter l'arrêt du processus
2. Déclencher automatiquement `/save`
3. Confirmer avec un message

### Hook Pre-commit
Avant chaque commit :
1. Vérifier qu'il n'y a pas de console.log
2. Vérifier qu'il n'y a pas de données mockées ajoutées
3. Vérifier que TypeScript compile sans erreurs
4. Mettre à jour MOCK_DATA_TRACKER.md si nécessaire

---

## 📈 Métriques de Succès

### Par Session
- Nombre de mocks supprimés > Nombre de mocks ajoutés
- 0 erreurs TypeScript
- 0 vulnérabilités de sécurité introduites
- 100% des API routes authentifiées

### Global (Objectif Final)
- 0 données mockées dans le projet
- 100% des features connectées au backend
- 100% de couverture de tests (à terme)
- Grade A+ sur l'analyse de sécurité

---

## ⚠️ Red Flags - Alerter l'Utilisateur

Si tu détectes un de ces patterns, ALERTER IMMÉDIATEMENT :

1. **Sécurité**
   - Password en clair
   - Pas d'authentification sur API route
   - SQL injection possible
   - XSS possible

2. **Architecture**
   - Duplication de code importante
   - Circular dependencies
   - Couplage trop fort

3. **Performance**
   - N+1 queries
   - Pas de pagination sur grandes listes
   - Pas de cache sur données statiques

4. **Data**
   - Ajout de nouvelles données mockées
   - Données sensibles dans le code
   - Pas de validation des inputs

---

## 🎓 Références Rapides

- **Architecture** : STACK.md
- **Roadmap** : TODO_PRODUCTION.md
- **Phase actuelle** : PHASE_1_GUIDE.md
- **Specs détaillées** : DOCUMENTATION_ERP.md
- **Tracking mock** : MOCK_DATA_TRACKER.md
- **Sessions** : .claude/sessions/

---

**Dernière mise à jour** : 17 novembre 2024
**Version** : 1.0
**Statut** : Actif
