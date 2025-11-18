#!/bin/bash

# =========================================
#  DigiWeb ERP - Démarrage automatique
# =========================================

# Sauvegarder le répertoire racine du projet
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=3000

# Mode de connexion : local ou tunnel
USE_TUNNEL=false
TUNNEL_PORT=3307
REMOTE_SERVER="digibe.app"  # Modifiez avec votre serveur
REMOTE_USER="ubuntu"         # Modifiez avec votre user SSH

# Configuration base de données
if [ "$1" == "--tunnel" ] || [ "$1" == "-t" ]; then
    USE_TUNNEL=true
    DB_USER="digibe_app"
    DB_PASS="3DOaxtIoUODvxSmW/hC6+q8i9ZBammUzfu3lTrOtp6I="
    DB_HOST="127.0.0.1"
    DB_PORT=$TUNNEL_PORT
    DB_NAME="digibe_app_prod"
else
    # Configuration locale (à adapter selon votre setup local)
    DB_USER="root"
    DB_PASS="root"
    DB_HOST="127.0.0.1"
    DB_PORT=3306
    DB_NAME="digiweb_erp_local"
fi

# Fonction pour afficher les messages
print_step() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Fonction pour vérifier si un port est utilisé
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Fonction pour tuer un processus sur un port
kill_port() {
    if check_port $1; then
        print_warning "Port $1 déjà utilisé, arrêt du processus..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Fonction pour vérifier les prérequis
check_requirements() {
    print_step "Vérification des prérequis"

    # Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé"
        exit 1
    fi
    print_success "Node.js $(node -v)"

    # NPM
    if ! command -v npm &> /dev/null; then
        print_error "NPM n'est pas installé"
        exit 1
    fi
    print_success "NPM $(npm -v)"

    # MySQL Client (optionnel mais recommandé)
    if command -v mysql &> /dev/null; then
        print_success "MySQL Client disponible"
    else
        print_warning "MySQL Client non trouvé (optionnel)"
    fi
}

# Header
clear
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}       ${GREEN}🚀 DigiWeb ERP - Démarrage Automatique 🚀${NC}          ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"

# Mode tunnel SSH
if [ "$USE_TUNNEL" == true ]; then
    echo ""
    echo -e "${YELLOW}📡 Mode Tunnel SSH Activé${NC}"
    echo -e "${BLUE}Connexion à la base distante via tunnel SSH${NC}"

    # Vérifier si le tunnel existe
    if lsof -Pi :$TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Tunnel SSH actif sur le port $TUNNEL_PORT${NC}"
    else
        echo -e "${YELLOW}⚠ Création du tunnel SSH...${NC}"
        echo -e "Connexion à ${REMOTE_USER}@${REMOTE_SERVER}..."

        # Créer le tunnel en arrière-plan
        ssh -f -N -L ${TUNNEL_PORT}:localhost:3306 ${REMOTE_USER}@${REMOTE_SERVER}

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Tunnel SSH créé avec succès${NC}"
            sleep 2
        else
            echo -e "${RED}✗ Impossible de créer le tunnel SSH${NC}"
            echo "Vérifiez votre connexion SSH au serveur"
            exit 1
        fi
    fi
fi

# Vérification des prérequis
check_requirements

# Étape 1 : MySQL
if [ "$USE_TUNNEL" == true ]; then
    print_step "[1/7] Vérification de la connexion à la base distante"
    if command -v mysql &> /dev/null; then
        if ! mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASS" --silent > /dev/null 2>&1; then
            print_warning "Impossible de se connecter à la base de données distante"
            print_warning "Le tunnel est actif, mais la connexion MySQL échoue"
            print_warning "Continuons quand même (Prisma tentera la connexion)..."
        else
            print_success "Connexion à la base de données distante établie"
        fi
    else
        print_warning "MySQL client non installé, impossible de tester la connexion"
        print_warning "Continuons quand même (Prisma tentera la connexion)..."
    fi
else
    print_step "[1/7] Vérification de MySQL local"
    if command -v mysql &> /dev/null; then
        if ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" --silent > /dev/null 2>&1; then
            print_warning "MySQL n'est pas démarré. Tentative de démarrage..."

            # Essayer différentes commandes selon l'OS
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                sudo service mysql start 2>/dev/null || sudo systemctl start mysql 2>/dev/null || sudo systemctl start mariadb 2>/dev/null
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                brew services start mysql 2>/dev/null || mysql.server start 2>/dev/null
            elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
                net start MySQL80 2>/dev/null || net start MySQL 2>/dev/null
            fi

            sleep 3

            if ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" --silent > /dev/null 2>&1; then
                print_warning "MySQL ne répond pas"
                print_warning "Si vous utilisez Docker ou un autre setup, ignorez cette erreur"
            else
                print_success "MySQL local démarré"
            fi
        else
            print_success "MySQL local est actif"
        fi

        # Créer la base de données locale si elle n'existe pas
        if [ "$USE_TUNNEL" == false ]; then
            mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
            if [ $? -eq 0 ]; then
                print_success "Base de données locale '$DB_NAME' créée/vérifiée"
            else
                print_warning "Impossible de créer la base locale (peut-être déjà existante)"
            fi
        fi
    else
        print_warning "MySQL client non installé"
        print_warning "Si vous utilisez Docker ou PostgreSQL, ignorez cette erreur"
    fi
fi

# Étape 2 : Configuration .env
print_step "[2/7] Configuration des variables d'environnement"
cd "$PROJECT_ROOT"

# Sauvegarder le .env existant
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup du .env créé"
fi

# Créer/mettre à jour le .env selon le mode
if [ "$USE_TUNNEL" == true ]; then
    # Mode tunnel : utiliser les credentials de production via tunnel
    cat > .env << EOF
# ============================================
# DEVELOPMENT WITH TUNNEL TO PRODUCTION DB
# ============================================

# Base de données via tunnel SSH
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# NextAuth.js Development
NEXTAUTH_URL="http://localhost:${FRONTEND_PORT}"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Node Environment
NODE_ENV="development"

# APIs Externes (dev/test keys)
# PAPPERS_API_KEY=""
# COFACE_API_KEY=""
# AIRCALL_API_KEY=""
# YOUSIGN_API_KEY=""
EOF
    print_success "Fichier .env configuré pour le mode tunnel"
else
    # Mode local
    cat > .env << EOF
# ============================================
# LOCAL DEVELOPMENT ENVIRONMENT
# ============================================

# Base de données locale
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# NextAuth.js Development
NEXTAUTH_URL="http://localhost:${FRONTEND_PORT}"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Node Environment
NODE_ENV="development"

# APIs Externes (dev/test keys)
# PAPPERS_API_KEY=""
# COFACE_API_KEY=""
# AIRCALL_API_KEY=""
# YOUSIGN_API_KEY=""
EOF
    print_success "Fichier .env configuré pour le mode local"
fi

# Étape 3 : Dépendances
print_step "[3/7] Installation des dépendances"
if [ ! -d "node_modules" ]; then
    print_warning "Installation des dépendances NPM (peut prendre quelques minutes)..."
    npm install --silent
    print_success "Dépendances installées"
else
    print_success "Dépendances déjà installées"
fi

# Étape 4 : Prisma Generate
print_step "[4/7] Génération du client Prisma"
npx prisma generate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Client Prisma généré"
else
    print_error "Erreur lors de la génération du client Prisma"
    exit 1
fi

# Étape 5 : Prisma DB Push (uniquement en mode local)
if [ "$USE_TUNNEL" == false ]; then
    print_step "[5/7] Synchronisation du schéma Prisma avec la base locale"
    print_warning "Exécution de 'prisma db push' (peut prendre quelques secondes)..."
    npx prisma db push --skip-generate > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_success "Schéma synchronisé avec la base de données locale"
    else
        print_warning "Erreur lors de la synchronisation (peut-être déjà à jour)"
    fi
else
    print_step "[5/7] Schéma Prisma (mode tunnel - skip db push)"
    print_warning "Mode tunnel activé - pas de modification de la base distante"
    print_success "Client Prisma prêt à utiliser la base distante"
fi

# Étape 6 : Nettoyage des ports
print_step "[6/7] Nettoyage des ports"
kill_port $FRONTEND_PORT
print_success "Ports libérés"

# Étape 7 : Démarrage du serveur Next.js
print_step "[7/7] Démarrage du serveur Next.js"

# Créer un fichier pour stocker les PIDs
PID_FILE="/tmp/digiweb_erp_pids.txt"
> $PID_FILE

print_warning "Démarrage de Next.js sur le port $FRONTEND_PORT..."

# Variables d'environnement pour améliorer le HMR avec WSL
export CHOKIDAR_USEPOLLING=true
export WATCHPACK_POLLING=true

# Lancer Next.js en développement
npm run dev > "$PROJECT_ROOT/server.log" 2>&1 &
SERVER_PID=$!
echo "SERVER=$SERVER_PID" >> $PID_FILE
sleep 5

# Vérifier si le serveur a démarré
if kill -0 $SERVER_PID 2>/dev/null; then
    print_success "Next.js démarré (PID: $SERVER_PID)"
else
    print_error "Échec du démarrage de Next.js"
    print_warning "Vérifiez les logs : tail -f server.log"
    exit 1
fi

# Affichage final
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 APPLICATION DÉMARRÉE ! 🎉                 ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 Accès à l'application :${NC}"
echo -e "   ${GREEN}DigiWeb ERP :${NC} http://localhost:$FRONTEND_PORT"

if [ "$USE_TUNNEL" == true ]; then
    echo ""
    echo -e "${BLUE}🔌 Connexion base de données :${NC}"
    echo -e "   ${GREEN}Mode :${NC} Tunnel SSH vers $REMOTE_SERVER"
    echo -e "   ${GREEN}Port local :${NC} $TUNNEL_PORT → Port distant : 3306"
    echo -e "   ${GREEN}Base :${NC} $DB_NAME"
fi

echo ""
echo -e "${BLUE}📊 Commandes utiles :${NC}"
echo -e "   ${YELLOW}Prisma Studio :${NC} npx prisma studio"
echo -e "   ${YELLOW}Voir les logs :${NC} tail -f server.log"
echo -e "   ${YELLOW}Arrêter l'app :${NC} ./stop.sh"

if [ "$USE_TUNNEL" == false ]; then
    echo -e "   ${YELLOW}Passer en mode tunnel :${NC} ./start.sh --tunnel"
fi

echo ""
echo -e "${GREEN}✨ L'application est prête ! Ouvrez votre navigateur.${NC}"

# Garder le script actif
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter le serveur${NC}"

# Fonction de nettoyage à l'arrêt
cleanup() {
    echo ""
    print_warning "Arrêt du serveur..."

    if [ -f $PID_FILE ]; then
        source $PID_FILE
        kill $SERVER 2>/dev/null && print_success "Serveur arrêté"
        rm $PID_FILE
    fi

    print_success "Application arrêtée"
    exit 0
}

# Capturer Ctrl+C
trap cleanup INT

# Attendre
while true; do
    sleep 1
done
