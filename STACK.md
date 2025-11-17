# 🚀 Stack Technique - DIGIWEB ERP v0

## 📋 Vue d'ensemble

DIGIWEB ERP est une application web moderne de gestion d'entreprise (ERP/CRM) construite avec les dernières technologies web.

---

## 🎨 Frontend

### Framework & Bibliothèques
- **Next.js 14.2.33** - Framework React full-stack avec App Router
- **React 18** - Bibliothèque UI pour interfaces utilisateur
- **TypeScript** - Typage statique JavaScript pour un code plus robuste

### Styling & UI
- **Tailwind CSS 3.4.1** - Framework CSS utility-first
- **Framer Motion** - Bibliothèque d'animations et transitions fluides
- **Lucide React** - Collection d'icônes modernes et légères
- **Custom Design System** - Classes utilitaires personnalisées

### Features UI
- ✅ Sidebar collapsible (mode compact = icônes / mode étendu = icônes + texte)
- ✅ Navigation HubSpot-style avec catégories
- ✅ Thème clair avec sidebar gradient bleu
- ✅ Responsive design (mobile-first)
- ✅ Animations et transitions fluides
- ✅ Composants réutilisables

---

## 🔧 Backend & Database

### ORM & Database
- **Prisma ORM** - ORM moderne pour TypeScript/JavaScript
- **MySQL** - Base de données relationnelle
- **25 tables** incluant:
  - Users, Roles, Permissions
  - Contacts, Companies, Deals
  - Activities, Tasks, Notes
  - Quotes, Invoices, Payments
  - Campaigns, Emails, Social Posts
  - Tickets, Knowledge Base
  - Workflows, Sequences, Actions

### Authentification & Sécurité
- **NextAuth.js (beta)** - Solution d'authentification complète
- **bcryptjs** - Hashing sécurisé des mots de passe
- **Zod** - Validation de schémas et données

### API & Intégrations (Prévues)
- **PAPPERS API** - Données entreprises françaises (SIRET, gérants, etc.)
- **COFACE API** - Scoring de solvabilité et risque crédit
- **AIRCALL API** - Intégration téléphonie cloud
- **YOUSIGN API** - Signature électronique de documents
- **Google Analytics** - Analytics et tracking web
- **Haloscan** - Analyse comportementale visiteurs

---

## 🏗️ Architecture

### Structure Next.js
```
digiweb-erp/
├── prisma/
│   └── schema.prisma          # Schéma de données (25 tables)
├── src/
│   └── app/
│       ├── dashboard/
│       │   ├── layout.tsx     # Layout principal avec sidebar
│       │   ├── page.tsx       # Dashboard home
│       │   ├── crm/           # Module CRM (Contacts, Entreprises, Deals, Activités)
│       │   ├── sales/         # Module Ventes (Pipeline, Devis, Factures)
│       │   ├── marketing/     # Module Marketing (Campagnes, Email, Social)
│       │   ├── service/       # Module Service (Tickets, KB, Satisfaction)
│       │   ├── automation/    # Module Automatisation (Workflows, Séquences)
│       │   ├── reports/       # Module Rapports (Analytics, Dashboards)
│       │   └── settings/      # Paramètres utilisateur
│       ├── login/
│       │   └── page.tsx       # Page de connexion
│       ├── globals.css        # Styles globaux et classes utilitaires
│       └── page.tsx           # Landing page
├── DOCUMENTATION_ERP.md       # Documentation complète des modules
├── PHASE_1_GUIDE.md          # Guide d'implémentation Phase 1
├── TODO_PRODUCTION.md        # Roadmap production (127+ tâches)
└── STACK.md                  # Ce fichier
```

### Patterns & Concepts
- **App Router** - Nouveau système de routing Next.js
- **Server Components** - Composants React côté serveur (par défaut)
- **Client Components** - Composants interactifs avec `'use client'`
- **API Routes** - Endpoints API Next.js (à implémenter)
- **Middleware** - Gestion des redirections et auth (à implémenter)

---

## 🔐 Système de Rôles

### Rôles Utilisateurs
- **ADMIN** - Accès complet à tous les modules
- **VENTE** - CRM, Ventes, Rapports
- **MARKETING** - Marketing, Campagnes, Analytics
- **ACCOUNT_MANAGEMENT** - Service, Tickets, Satisfaction
- **USER** - Accès de base

### Permissions
- Gestion granulaire par module
- Contrôle d'accès basé sur les rôles (RBAC)
- Permissions personnalisables

---

## 📊 Modules Fonctionnels

### 1. CRM (Customer Relationship Management)
- **Contacts** - Gestion des contacts avec scoring qualité
- **Entreprises** - Fiches entreprises (SIRET, gérant, localisation)
- **Deals** - Pipeline des affaires (6 étapes + PERDUS)
- **Activités** - Historique complet (appels, emails, réunions, tâches)

### 2. Ventes
- **Pipeline** - Visualisation Kanban des deals
- **Devis** - Création et gestion des devis
- **Facturation** - Génération et suivi des factures
- **Suivi Commercial** - Analytics et performance

### 3. Marketing
- **Campagnes** - Gestion des campagnes marketing
- **Email Marketing** - Envoi d'emails en masse
- **Réseaux Sociaux** - Planification et publication
- **Analytics** - Métriques et ROI

### 4. Service Client
- **Tickets** - Support client et SAV
- **Base de Connaissances** - Documentation et FAQ
- **Satisfaction** - Enquêtes NPS et CSAT

### 5. Automatisation
- **Workflows** - Automatisation des processus
- **Séquences** - Emails automatiques et follow-ups

### 6. Rapports
- **Analytics** - Tableaux de bord personnalisables
- **Dashboards** - Visualisation des KPIs

---

## 🛠️ Outils de Développement

### Version Control & CI/CD
- **Git** - Contrôle de version
- **GitHub** - Hébergement du code (DigiflowAgency/DIGIWEB-V0)
- **GitHub Actions** - CI/CD (à configurer)

### Qualité du Code
- **ESLint** - Linting JavaScript/TypeScript
- **Prettier** - Formatage automatique du code (à configurer)
- **TypeScript Strict Mode** - Typage strict

### Gestionnaire de Paquets
- **npm** - Gestionnaire de paquets Node.js

---

## 📦 Dépendances Principales

### Production
```json
{
  "next": "14.2.33",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5",
  "@prisma/client": "latest",
  "prisma": "latest",
  "next-auth": "beta",
  "bcryptjs": "latest",
  "zod": "latest",
  "framer-motion": "latest",
  "lucide-react": "latest"
}
```

### Développement
```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "@types/bcryptjs": "latest",
  "eslint": "^8",
  "eslint-config-next": "14.2.33",
  "tailwindcss": "^3.4.1",
  "postcss": "^8",
  "autoprefixer": "^10.0.1"
}
```

---

## 🎯 Roadmap d'Implémentation

### ✅ Phase 0 - Base (TERMINÉ)
- [x] Configuration Next.js + TypeScript
- [x] Design system Tailwind CSS
- [x] Navigation et sidebar collapsible
- [x] Structure des pages (20+ pages)
- [x] Schéma Prisma (25 tables)
- [x] Documentation complète
- [x] Repository GitHub

### 🔄 Phase 1 - Infrastructure (EN COURS)
- [ ] Installation et configuration MySQL
- [ ] Migration Prisma et seed database
- [ ] Configuration NextAuth.js
- [ ] Variables d'environnement (.env)
- [ ] API endpoints de base
- [ ] Middleware d'authentification

### 📋 Phase 2-12 - Features (127+ tâches)
Voir `TODO_PRODUCTION.md` pour la roadmap complète

---

## 🌐 Variables d'Environnement

### Fichier `.env` (à créer)
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/digiweb_erp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# APIs (optionnel)
PAPPERS_API_KEY="your-pappers-api-key"
COFACE_API_KEY="your-coface-api-key"
AIRCALL_API_KEY="your-aircall-api-key"
YOUSIGN_API_KEY="your-yousign-api-key"
```

---

## 🚀 Installation & Démarrage

### Prérequis
- Node.js 18+ et npm
- MySQL 8.0+
- Git

### Installation
```bash
# Cloner le repository
git clone https://github.com/DigiflowAgency/DIGIWEB-V0.git
cd DIGIWEB-V0

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Générer le client Prisma
npx prisma generate

# Créer la base de données et lancer les migrations
npx prisma db push

# (Optionnel) Remplir avec des données de test
npx prisma db seed

# Lancer le serveur de développement
npm run dev
```

### Accès
- Application: http://localhost:3000
- Login démo: À configurer après Phase 1

---

## 📚 Documentation

- **DOCUMENTATION_ERP.md** - Documentation complète des modules et fonctionnalités
- **PHASE_1_GUIDE.md** - Guide détaillé pour implémenter la Phase 1 (Infrastructure)
- **TODO_PRODUCTION.md** - Roadmap de production avec 12 phases et 127+ tâches
- **STACK.md** - Ce fichier (stack technique)

---

## 🤝 Contribution

### Workflow Git
```bash
# Créer une branche pour votre feature
git checkout -b feature/nom-de-la-feature

# Faire vos modifications et commit
git add .
git commit -m "feat: description de la feature"

# Pousser sur GitHub
git push origin feature/nom-de-la-feature

# Créer une Pull Request sur GitHub
```

### Conventions de Commit
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage, style CSS
- `refactor:` - Refactoring du code
- `test:` - Ajout ou modification de tests
- `chore:` - Maintenance, config

---

## 📄 Licence

Projet propriétaire - DigiflowAgency

---

## 📞 Contact

- **Organisation**: DigiflowAgency
- **Repository**: https://github.com/DigiflowAgency/DIGIWEB-V0
- **Version**: v0 (Phase 0 complétée)

---

Dernière mise à jour: Janvier 2025
