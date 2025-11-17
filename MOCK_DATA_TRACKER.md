# 🎭 MOCK DATA TRACKER - DIGIWEB ERP

**Objectif** : Atteindre 0% de données mockées (100% backend réel)

**Dernière mise à jour** : 17 novembre 2024
**Progression globale** : 0% (0/1000+ mocks supprimés)

---

## 📊 Vue d'Ensemble

| Catégorie | Mocks Totaux | Supprimés | Restants | % Complété |
|-----------|--------------|-----------|----------|------------|
| **Authentification** | 1 | 0 | 1 | 0% |
| **Contacts CRM** | 15 | 0 | 15 | 0% |
| **Companies** | 5+ | 0 | 5+ | 0% |
| **Deals** | 8 | 0 | 8 | 0% |
| **Activities** | 10+ | 0 | 10+ | 0% |
| **Quotes** | 6+ | 0 | 6+ | 0% |
| **Invoices** | 8+ | 0 | 8+ | 0% |
| **Campaigns** | 10 | 0 | 10 | 0% |
| **Social Posts** | 6+ | 0 | 6+ | 0% |
| **Emails** | 5+ | 0 | 5+ | 0% |
| **Tickets** | 10+ | 0 | 10+ | 0% |
| **Knowledge Base** | 8+ | 0 | 8+ | 0% |
| **Reviews** | 8+ | 0 | 8+ | 0% |
| **Clients** | 5+ | 0 | 5+ | 0% |
| **Stats/KPIs** | 50+ | 0 | 50+ | 0% |
| **TOTAL** | **~1000+** | **0** | **~1000+** | **0%** |

---

## 🔴 DONNÉES MOCKÉES PAR FICHIER

### 1. Authentification

#### `src/app/login/page.tsx` (Lignes 40-50)
- **Type** : Système d'auth localStorage
- **Quantité** : 1 système complet
- **Priorité** : 🔴 CRITIQUE
- **Statut** : ❌ Mock
- **API Route Nécessaire** : `/api/auth/[...nextauth]`
- **Dépendances** : NextAuth.js, bcryptjs, Prisma User model

```typescript
// MOCK CODE À SUPPRIMER
localStorage.setItem('isAuthenticated', 'true');
localStorage.setItem('userEmail', email);
localStorage.setItem('userId', 'demo-user-' + Date.now());
```

**Plan de remplacement** :
- [ ] Installer NextAuth.js
- [ ] Configurer Prisma adapter
- [ ] Créer route API auth
- [ ] Remplacer localStorage par session
- [ ] Supprimer le mock

---

### 2. Dashboard - Page d'Accueil

#### `src/app/dashboard/page.tsx` (Lignes 24-120)

##### Stats KPIs (4 items)
```typescript
const stats = [
  { name: 'Leads actifs', value: '47', change: '+12%', ... },
  { name: 'RDV ce mois', value: '23', change: '+8%', ... },
  { name: 'CA du mois', value: '48 500 €', change: '+23%', ... },
  { name: 'Taux conversion', value: '34%', change: '+5%', ... },
];
```
- **Priorité** : 🟡 HAUTE
- **Statut** : ❌ Mock
- **API** : `/api/dashboard/stats`
- [ ] À remplacer

##### Leads Ultra Chauds (3 items)
```typescript
const hotLeads = [
  { id: 1, name: 'Restaurant Le Gourmet', score: 95, ... },
  { id: 2, name: 'Boutique Mode Élégance', score: 88, ... },
  { id: 3, name: 'Cabinet Avocat Dupont', score: 82, ... },
];
```
- **Priorité** : 🟡 HAUTE
- **Statut** : ❌ Mock
- **API** : `/api/leads?filter=hot&limit=3`
- [ ] À remplacer

##### Activité Hebdomadaire (7 jours)
- **Priorité** : 🟢 MOYENNE
- **Statut** : ❌ Mock
- **API** : `/api/analytics/weekly`
- [ ] À remplacer

##### Activité Récente (4 événements)
- **Priorité** : 🟡 HAUTE
- **Statut** : ❌ Mock
- **API** : `/api/activities/recent?limit=4`
- [ ] À remplacer

##### Actions Rapides (4 boutons)
- **Type** : UI statique (OK, pas besoin de backend)
- **Statut** : ✅ OK (pas de données)

##### Objectifs Mensuels (3 objectifs)
- **Priorité** : 🟢 MOYENNE
- **Statut** : ❌ Mock
- **API** : `/api/users/me/goals`
- [ ] À remplacer

---

### 3. CRM - Contacts

#### `src/app/dashboard/crm/contacts/page.tsx` (Lignes 19-35)

##### 15 Contacts Mockés
```typescript
const mockContacts = [
  { id: 1, name: 'Pierre Martin', email: 'pierre.martin@restaurant.fr', ... },
  { id: 2, name: 'Sophie Dubois', email: 'sophie@boutique.com', ... },
  // ... 13 autres
];
```
- **Priorité** : 🔴 CRITIQUE
- **Statut** : ❌ Mock
- **API** : `/api/contacts` (GET, POST, PUT, DELETE)
- [ ] À remplacer

##### Stats Contacts (4 stats calculées)
- Dépendent des contacts mockés
- **Statut** : ❌ Mock (calculés depuis mock)
- **API** : Même endpoint `/api/contacts` avec aggregation
- [ ] À remplacer

---

### 4. Ventes - Pipeline

#### `src/app/dashboard/sales/pipeline/page.tsx` (Lignes 15-50)

##### Étapes Pipeline (5 stages)
```typescript
const pipelineStages = [
  { id: 1, name: 'Prospection', deals: 12, value: 48500, ... },
  // ... 4 autres stages
];
```
- **Priorité** : 🟡 HAUTE
- **Statut** : ❌ Mock
- **API** : `/api/pipeline/stages`
- [ ] À remplacer

##### Deals Récents (8 deals)
- **Priorité** : 🟡 HAUTE
- **Statut** : ❌ Mock
- **API** : `/api/deals?limit=8&sort=recent`
- [ ] À remplacer

##### Taux de Conversion (4 rates)
- **Priorité** : 🟢 MOYENNE
- **Statut** : ❌ Mock
- **API** : `/api/pipeline/conversion-rates`
- [ ] À remplacer

---

### 5. Marketing - Campagnes

#### `src/app/dashboard/marketing/campaigns/page.tsx` (Lignes 15-45)

##### 10 Campagnes
```typescript
const mockCampaigns = [
  { id: 1, name: 'Lancement Automne 2024', type: 'Email', ... },
  // ... 9 autres
];
```
- **Priorité** : 🟢 MOYENNE
- **Statut** : ❌ Mock
- **API** : `/api/campaigns`
- [ ] À remplacer

---

### 6. Service - Tickets

#### `src/app/dashboard/service/tickets/page.tsx` (Lignes 15-40)

##### 10 Tickets
```typescript
const mockTickets = [
  { id: 'T-001', subject: 'Problème connexion', ... },
  // ... 9 autres
];
```
- **Priorité** : 🟢 MOYENNE
- **Statut** : ❌ Mock
- **API** : `/api/tickets`
- [ ] À remplacer

---

### 7. Autres Fichiers avec Mock Data

| Fichier | Mocks | Priorité | Statut |
|---------|-------|----------|--------|
| `service/knowledge/page.tsx` | 8+ articles | 🟢 Basse | ❌ Mock |
| `service/satisfaction/page.tsx` | 8+ avis | 🟢 Basse | ❌ Mock |
| `marketing/social/page.tsx` | 6+ posts | 🟢 Basse | ❌ Mock |
| `marketing/email/page.tsx` | 5+ emails | 🟢 Basse | ❌ Mock |
| `reports/analytics/page.tsx` | Stats diverses | 🟢 Basse | ❌ Mock |
| `reports/dashboards/page.tsx` | 4 dashboards | 🟢 Basse | ❌ Mock |
| `suivi-client/page.tsx` | 5+ clients | 🟡 Haute | ❌ Mock |
| `sales/invoices/page.tsx` | 8+ factures | 🟡 Haute | ❌ Mock |
| `sales/quotes/page.tsx` | 6+ devis | 🟡 Haute | ❌ Mock |
| `sales/tracking/page.tsx` | Données tracking | 🟢 Moyenne | ❌ Mock |

---

## 📋 PLAN DE SUPPRESSION (Phases)

### Phase 1 - Infrastructure (Semaine 1)
- [x] Créer ce tracker
- [ ] Configurer base de données MySQL
- [ ] Lancer migrations Prisma
- [ ] Créer `/api/auth/[...nextauth]`
- [ ] **Supprimer mock auth** ✨

**Objectif** : -1 mock (Auth)

### Phase 2 - CRM Core (Semaine 2)
- [ ] Créer `/api/contacts` (CRUD)
- [ ] Créer `/api/companies` (CRUD)
- [ ] Créer `/api/deals` (CRUD)
- [ ] Créer `/api/activities` (CRUD)
- [ ] Refactor pages CRM pour utiliser APIs
- [ ] **Supprimer mocks CRM** ✨

**Objectif** : -50 mocks (Contacts, Companies, Deals, Activities)

### Phase 3 - Ventes (Semaine 3)
- [ ] Créer `/api/quotes` (CRUD)
- [ ] Créer `/api/invoices` (CRUD)
- [ ] Créer `/api/pipeline` (Analytics)
- [ ] Refactor pages Ventes
- [ ] **Supprimer mocks Ventes** ✨

**Objectif** : -30 mocks (Quotes, Invoices, Pipeline)

### Phase 4 - Marketing (Semaine 4)
- [ ] Créer `/api/campaigns` (CRUD)
- [ ] Créer `/api/social-posts` (CRUD)
- [ ] Créer `/api/email-campaigns` (CRUD)
- [ ] Refactor pages Marketing
- [ ] **Supprimer mocks Marketing** ✨

**Objectif** : -30 mocks (Campaigns, Posts, Emails)

### Phase 5 - Service (Semaine 5)
- [ ] Créer `/api/tickets` (CRUD)
- [ ] Créer `/api/knowledge-base` (CRUD)
- [ ] Créer `/api/reviews` (CRUD + import)
- [ ] Refactor pages Service
- [ ] **Supprimer mocks Service** ✨

**Objectif** : -30 mocks (Tickets, KB, Reviews)

### Phase 6 - Analytics & Rapports (Semaine 6)
- [ ] Créer `/api/analytics/*` (Divers endpoints)
- [ ] Créer `/api/dashboard/stats`
- [ ] Refactor pages Rapports
- [ ] **Supprimer mocks Analytics** ✨

**Objectif** : -50 mocks (Stats, KPIs, Analytics)

---

## ✅ HISTORIQUE DES SUPPRESSIONS

### [DATE] - Session X
- ❌ Rien supprimé pour l'instant

---

## 🎯 RÈGLES DE SUPPRESSION

### ✅ AUTORISÉ de supprimer un mock quand :
1. L'API route correspondante existe
2. L'API route est testée et fonctionne
3. Le frontend a été refactoré pour utiliser l'API
4. Les tests passent (quand ils existeront)

### ❌ INTERDIT de supprimer un mock :
1. Sans API route de remplacement
2. Sans tester que ça fonctionne
3. Sans mettre à jour ce tracker

### 📝 Processus de suppression :
```bash
# 1. Créer l'API route
# 2. Tester manuellement
# 3. Refactor le frontend
# 4. Supprimer le mock
# 5. Mettre à jour ce fichier
# 6. Commit
git add .
git commit -m "feat: replace mock [NOM] with real API"
```

---

## 📈 MÉTRIQUES

### Objectif Final
- **0 données mockées** dans le projet
- **100% backend réel**
- **Toutes les pages connectées aux APIs**

### Progression Hebdomadaire Attendue
- Semaine 1: 0% → 5% (Auth)
- Semaine 2: 5% → 30% (CRM)
- Semaine 3: 30% → 50% (Ventes)
- Semaine 4: 50% → 70% (Marketing)
- Semaine 5: 70% → 90% (Service)
- Semaine 6: 90% → 100% (Analytics)

---

**🎯 Remember : Every mock removed is a step closer to production !**
