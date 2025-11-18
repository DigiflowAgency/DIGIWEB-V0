# 🚀 Guide de Déploiement Production - DigiWeb ERP

**Date** : 17 novembre 2025
**Objectif** : Setup base de données production

**Note** : Les étapes code/PM2/Nginx/SSL sont déjà maîtrisées ✅

---

## 🗄️ ÉTAPE 1 : Créer Base de Données MySQL

### 1.2 Créer la base de données + user
```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE digiweb_erp_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'digiweb_prod'@'localhost' IDENTIFIED BY 'MotDePasseSecurise123!';
GRANT ALL PRIVILEGES ON digiweb_erp_prod.* TO 'digiweb_prod'@'localhost';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user WHERE user='digiweb_prod';
EXIT;
```

### 1.3 Tester la connexion
```bash
mysql -u digiweb_prod -p digiweb_erp_prod
SHOW DATABASES;
EXIT;
```

**✅ Durée : 5 minutes**

---

## ⚙️ ÉTAPE 2 : Configuration Variables d'Environnement

### 2.1 Dans le dossier du projet sur le serveur
```bash
cd /var/www/digiweb-erp  # ou ton chemin
nano .env
```

### 2.2 Ajouter/Modifier les variables
```env
# Base de données PRODUCTION
DATABASE_URL="mysql://digiweb_prod:MotDePasseSecurise123!@localhost:3306/digiweb_erp_prod"

# NextAuth PRODUCTION (⚠️ générer nouveau secret!)
NEXTAUTH_URL="https://erp.digiweb.fr"
NEXTAUTH_SECRET="REMPLACER_PAR_SECRET_GENERE"

# SMTP (si utilisé)
SMTP_HOST="smtp.provider.com"
SMTP_PORT="587"
SMTP_USER="noreply@digiweb.fr"
SMTP_PASSWORD="password"

# APIs Production (⚠️ clés PROD uniquement!)
PAPPERS_API_KEY="prod_key_here"
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
```

### 2.3 Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
# Copier le résultat dans NEXTAUTH_SECRET
```

**✅ Durée : 5 minutes**

---

## 🗃️ ÉTAPE 3 : Créer les Tables avec Prisma

### 3.1 Push le schéma (crée automatiquement les 30 tables!)
```bash
npx prisma db push
```

**Sortie attendue :**
```
✔ Generated Prisma Client
✔ Your database is now in sync with your schema.
```

### 3.2 Vérifier les tables créées
```bash
mysql -u digiweb_prod -p digiweb_erp_prod
```

```sql
SHOW TABLES;
-- Tu verras : users, contacts, companies, deals, activities,
-- quotes, invoices, products, tickets, reviews, campaigns, etc.
-- Total : 30 tables ✅
EXIT;
```

**OU avec Prisma Studio :**
```bash
npx prisma studio
# Ouvrir : http://localhost:5555
```

### 3.3 Créer le user admin initial (optionnel)
```bash
# Option 1 : Avec seed si tu as un script
npx prisma db seed

# Option 2 : Manuellement via Prisma Studio
# Table "users" → Créer un user avec :
# - email: admin@digiweb.fr
# - password: (hashé avec bcrypt)
# - role: ADMIN
# - status: ACTIVE
```

**✅ Durée : 10 minutes**

---

## 📊 Récapitulatif

| Étape | Durée |
|-------|-------|
| 1. Créer BDD MySQL | 5 min |
| 2. Config .env | 5 min |
| 3. Prisma db push | 10 min |
| **TOTAL** | **20 min** ⚡ |

---

## 🆘 Troubleshooting

### Problème : Erreur de connexion BDD
```bash
# Vérifier connexion
mysql -u digiweb_prod -p digiweb_erp_prod

# Vérifier le .env
cat .env | grep DATABASE_URL
```

### Problème : Prisma db push échoue
```bash
# Vérifier que la BDD est vide
mysql -u digiweb_prod -p digiweb_erp_prod
SHOW TABLES;

# Force reset si besoin
npx prisma db push --force-reset
```

### Problème : Tables non créées
```bash
# Regénérer le client Prisma
npx prisma generate

# Re-push
npx prisma db push
```

---

## 🔄 Mises à Jour Futures du Schéma

Si tu modifies le schéma Prisma en local et veux l'appliquer en prod :

```bash
# Sur le serveur
cd /var/www/digiweb-erp
git pull origin main
npx prisma db push
# Les nouvelles tables/colonnes seront ajoutées automatiquement
```

---

**🎉 Base de données production prête !** 🚀

