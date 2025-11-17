# 🚀 PHASE 1 : Infrastructure & Base Technique

**Durée estimée :** 12-15 heures
**Objectif :** Mettre en place la base de données, l'authentification et l'environnement

---

## 📋 Checklist Complète

### ✅ Partie 1 : Base de Données (4-5h)

#### 1.1 Installation de Prisma
```bash
# Si pas déjà installé
npm install prisma @prisma/client
npm install -D prisma
```

#### 1.2 Configuration de la BDD MySQL

**Option A : MySQL Local**
```bash
# Installer MySQL (si pas déjà fait)
# macOS
brew install mysql
brew services start mysql

# Créer la base de données
mysql -u root -p
CREATE DATABASE digiweb_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

**Option B : Base de Données Cloud (Recommandé pour prod)**
- **PlanetScale** (gratuit, sans migration) : https://planetscale.com
- **Supabase** (gratuit, PostgreSQL mais on peut adapter)
- **Railway** : https://railway.app

#### 1.3 Configuration `.env`

Créer le fichier `.env` à la racine :

```env
# ============================================
# DATABASE
# ============================================
# Option A : MySQL Local
DATABASE_URL="mysql://root:VOTRE_PASSWORD@localhost:3306/digiweb_erp"

# Option B : PlanetScale (recommandé)
# DATABASE_URL="mysql://USERNAME:PASSWORD@HOST/digiweb_erp?sslaccept=strict"

# ============================================
# NEXTAUTH (on va le faire après)
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="VOTRE_SECRET_GENERE" # On va le générer

# ============================================
# EMAIL (pour envoi d'emails)
# ============================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="votre-email@gmail.com"
SMTP_PASSWORD="votre-mot-de-passe-app" # App password Gmail
SMTP_FROM="DigiWeb ERP <noreply@digiweb.fr>"

# ============================================
# APIs EXTERNES (à remplir plus tard)
# ============================================
# PAPPERS
PAPPERS_API_KEY=""

# COFACE
COFACE_API_KEY=""

# AIRCALL
AIRCALL_API_ID=""
AIRCALL_API_TOKEN=""

# YOUSIGN
YOUSIGN_API_KEY=""

# GOOGLE ANALYTICS
GA_DIGIFLOW_ID=""
GA_BEHYPE_ID=""

# HALOSCAN
HALOSCAN_API_KEY=""

# META / FACEBOOK
META_APP_ID=""
META_APP_SECRET=""

# GOOGLE ADS
GOOGLE_ADS_CLIENT_ID=""
GOOGLE_ADS_CLIENT_SECRET=""
```

**🔒 Sécurité :** Ne JAMAIS commit le fichier `.env` !

Créer `.env.example` (sans les vraies valeurs) :
```bash
cp .env .env.example
# Puis éditer .env.example et remplacer les vraies valeurs par des placeholders
```

Ajouter `.env` au `.gitignore` :
```bash
echo ".env" >> .gitignore
```

#### 1.4 Le Schema Prisma est déjà créé

✅ Le fichier `prisma/schema.prisma` est déjà prêt avec :
- 25 tables complètes
- Tous les enums nécessaires
- Toutes les relations
- Indexes pour performance
- Configuré pour MySQL

**Tables principales :**
- `users` - Utilisateurs avec rôles
- `contacts` - Contacts CRM
- `companies` - Entreprises
- `deals` - Opportunités commerciales
- `activities` - Activités (appels, réunions)
- `quotes` - Devis
- `invoices` - Factures
- `tickets` - Tickets support
- `formations` - Formations vidéo
- `clients` - Clients actifs
- `reviews` - Avis clients
- `integrations` - APIs connectées
- Et plein d'autres...

#### 1.5 Générer le Client Prisma

```bash
npx prisma generate
```

Cela va créer le client TypeScript avec tous les types.

#### 1.6 Créer la BDD (Push Schema)

**Attention :** `prisma db push` écrase la BDD. À utiliser seulement en dev initial.

```bash
npx prisma db push
```

Cela va :
- Créer toutes les tables dans MySQL
- Appliquer tous les index
- Configurer les relations

**Alternative pour la prod :** Utiliser les migrations
```bash
npx prisma migrate dev --name init
```

#### 1.7 Vérifier dans MySQL

```bash
mysql -u root -p
USE digiweb_erp;
SHOW TABLES;
DESCRIBE users;
EXIT;
```

Vous devriez voir toutes vos tables.

#### 1.8 (Optionnel) Seed de données de test

Créer `prisma/seed.ts` :

```typescript
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash('Admin2024!', 10);

  // Créer un admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@digiweb.fr',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'DigiWeb',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Créer quelques commerciaux
  const commercial1 = await prisma.user.create({
    data: {
      email: 'alex@digiweb.fr',
      password: hashedPassword,
      firstName: 'Alexandre',
      lastName: 'Martin',
      role: Role.VENTE,
      monthlyGoal: 50000,
    },
  });

  console.log('✅ Commercial created:', commercial1.email);

  // Créer quelques contacts
  const contact = await prisma.contact.create({
    data: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      phone: '0612345678',
      status: 'LEAD',
      assignedToId: commercial1.id,
    },
  });

  console.log('✅ Contact created:', contact.email);

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Ajouter au `package.json` :
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Installer ts-node :
```bash
npm install -D ts-node
```

Lancer le seed :
```bash
npx prisma db seed
```

#### 1.9 Prisma Studio (Interface visuelle)

Pour voir/éditer les données visuellement :
```bash
npx prisma studio
```

Cela ouvre une interface web sur `http://localhost:5555`

---

### ✅ Partie 2 : Authentification avec NextAuth (5-6h)

#### 2.1 Installation

```bash
npm install next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs
```

**Note :** On utilise `next-auth@beta` pour Next.js 14+ avec App Router.

#### 2.2 Générer le NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copier le résultat dans votre `.env` :
```env
NEXTAUTH_SECRET="le_secret_généré_ici"
```

#### 2.3 Créer la structure Auth

**Fichier : `/lib/auth.ts`**

```typescript
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Vérifier que le user est actif
        if (user.status !== 'ACTIVE') {
          return null;
        }

        // Mettre à jour lastLoginAt
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 jours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

**Fichier : `/types/next-auth.d.ts`**

Créer ce fichier pour étendre les types NextAuth :

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}
```

#### 2.4 API Route NextAuth

**Fichier : `/app/api/auth/[...nextauth]/route.ts`**

```typescript
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

#### 2.5 Provider dans le Layout

Modifier `/app/layout.tsx` :

```typescript
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SessionProvider } from 'next-auth/react';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'DigiWeb ERP',
  description: 'ERP Complet pour la gestion commerciale',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

#### 2.6 Modifier la page Login

Remplacer `/app/login/page.tsx` :

```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-violet-orange p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-lg mb-4">
            <span className="text-3xl font-bold bg-gradient-to-br from-violet-700 to-orange-500 bg-clip-text text-transparent">
              DW
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DigiWeb ERP</h1>
          <p className="text-violet-100">Connectez-vous à votre espace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none transition"
                  placeholder="alex@digiweb.fr"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-violet-700 to-orange-500 text-white py-3 px-4 rounded-lg font-semibold hover:from-violet-800 hover:to-orange-600 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Connexion en cours...</span>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Account Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <span className="font-semibold">Compte démo :</span>
              <br />
              admin@digiweb.fr / Admin2024!
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-violet-100 text-sm mt-6">
          DigiWeb ERP - Solution de gestion commerciale
        </p>
      </div>
    </div>
  );
}
```

#### 2.7 Protéger les routes avec Middleware

**Fichier : `/middleware.ts`** (à la racine)

```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Vérifier les permissions par rôle
    // On fera ça plus tard de manière plus détaillée

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/contacts/:path*',
    '/api/companies/:path*',
    '/api/deals/:path*',
    // Ajouter toutes les routes à protéger
  ],
};
```

#### 2.8 Modifier la page d'accueil

Remplacer `/app/page.tsx` :

```typescript
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent mx-auto"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
```

#### 2.9 Helper pour récupérer la session dans les pages

**Fichier : `/lib/session.ts`**

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}
```

Utilisation dans une page :
```typescript
import { getCurrentUser } from '@/lib/session';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Bonjour {user.name} !</div>;
}
```

---

### ✅ Partie 3 : Configuration Environnement (2-3h)

#### 3.1 Configuration Next.js

**Fichier : `/next.config.js`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'localhost',
      'i.vimeocdn.com', // Pour les thumbnails Vimeo
      'img.youtube.com', // Pour les thumbnails YouTube
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'DigiWeb ERP',
    NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL,
  },
};

module.exports = nextConfig;
```

#### 3.2 Configuration TypeScript

**Fichier : `/tsconfig.json`** (déjà existant, vérifier paths)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### 3.3 Helper Prisma Client (Singleton)

**Fichier : `/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

Utilisation :
```typescript
import { prisma } from '@/lib/prisma';

const users = await prisma.user.findMany();
```

#### 3.4 Validation avec Zod

Installer Zod :
```bash
npm install zod
```

**Fichier : `/lib/validations/contact.ts`** (exemple)

```typescript
import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(['LEAD', 'PROSPECT', 'CLIENT']),
  assignedToId: z.string().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
```

---

## 🧪 Tests de la Phase 1

Une fois tout terminé, tester :

### Test 1 : Base de données
```bash
npx prisma studio
```
- ✅ Toutes les tables sont visibles
- ✅ Relations correctes
- ✅ Données du seed présentes

### Test 2 : Authentification
1. Aller sur `http://localhost:3000`
2. Redirection automatique vers `/login`
3. Se connecter avec `admin@digiweb.fr` / `Admin2024!`
4. ✅ Redirection vers `/dashboard`
5. ✅ Session active (pas de re-login au refresh)
6. Se déconnecter
7. ✅ Redirection vers `/login`
8. Essayer d'accéder à `/dashboard` sans être connecté
9. ✅ Redirection vers `/login`

### Test 3 : Variables d'environnement
```bash
node -e "console.log(process.env.DATABASE_URL)"
```
- ✅ Affiche l'URL de la BDD

---

## 📤 Quand tu as fini

Envoie-moi un message avec :

✅ "Phase 1 terminée"

Et dis-moi :
- ✅ La BDD est créée et fonctionne
- ✅ L'authentification marche
- ✅ Je peux me connecter et la session persiste
- ✅ Les variables d'env sont configurées

Ou si tu as des problèmes :
- ❌ Erreur rencontrée : [détails]
- ❌ Bloqué sur : [étape]

Je t'aiderai à débugger et on passera à la Phase 2 !

---

## 🔍 Checklist Finale Phase 1

- [ ] MySQL installé et démarré
- [ ] Base de données `digiweb_erp` créée
- [ ] Fichier `.env` configuré avec DATABASE_URL
- [ ] Fichier `.env.example` créé (sans vraies valeurs)
- [ ] `.env` ajouté au `.gitignore`
- [ ] `prisma/schema.prisma` vérifié
- [ ] `npx prisma generate` exécuté sans erreur
- [ ] `npx prisma db push` exécuté sans erreur
- [ ] Toutes les tables visibles dans `prisma studio`
- [ ] Seed de données exécuté (optionnel mais recommandé)
- [ ] NextAuth installé
- [ ] NEXTAUTH_SECRET généré et dans `.env`
- [ ] Fichier `/lib/auth.ts` créé
- [ ] Fichier `/types/next-auth.d.ts` créé
- [ ] API route `/app/api/auth/[...nextauth]/route.ts` créée
- [ ] `SessionProvider` ajouté au layout
- [ ] Page login modifiée pour utiliser NextAuth
- [ ] Middleware de protection créé
- [ ] Je peux me connecter avec le compte admin
- [ ] La session persiste au refresh
- [ ] Je suis redirigé si je ne suis pas connecté
- [ ] `/lib/prisma.ts` créé (singleton)
- [ ] `/lib/session.ts` créé
- [ ] Zod installé
- [ ] Tests de connexion/déconnexion réussis

**Total : 25 points à valider** ✅

---

**Bon courage ! 💪 Tu as tout ce qu'il faut pour réussir cette phase.**
