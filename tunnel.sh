#!/bin/bash

# =========================================
#  DigiWeb ERP - Tunnel SSH
# =========================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TUNNEL_PORT=3307
REMOTE_SERVER="digibe.app"
REMOTE_USER="ubuntu"

# Fonction pour afficher les messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Header
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}       ${GREEN}🔌 DigiWeb ERP - Tunnel SSH MySQL 🔌${NC}           ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier si le tunnel existe déjà
if lsof -Pi :$TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Un tunnel SSH est déjà actif sur le port $TUNNEL_PORT"

    # Demander à l'utilisateur s'il veut redémarrer
    echo ""
    echo -e "${YELLOW}Que voulez-vous faire ?${NC}"
    echo "  1) Garder le tunnel actuel"
    echo "  2) Redémarrer le tunnel"
    echo "  3) Arrêter le tunnel"
    echo ""
    read -p "Votre choix (1-3): " choice

    case $choice in
        1)
            print_info "Tunnel actuel maintenu"
            echo ""
            print_info "Port local: ${GREEN}$TUNNEL_PORT${NC} → Port distant: ${GREEN}3306${NC}"
            print_info "Serveur: ${GREEN}$REMOTE_USER@$REMOTE_SERVER${NC}"
            exit 0
            ;;
        2)
            print_warning "Arrêt du tunnel existant..."
            lsof -ti:$TUNNEL_PORT | xargs kill -9 2>/dev/null
            sleep 2
            print_success "Tunnel arrêté"
            ;;
        3)
            print_warning "Arrêt du tunnel..."
            lsof -ti:$TUNNEL_PORT | xargs kill -9 2>/dev/null
            sleep 1
            print_success "Tunnel arrêté"
            exit 0
            ;;
        *)
            print_error "Choix invalide"
            exit 1
            ;;
    esac
fi

# Créer le tunnel
echo ""
print_info "Création du tunnel SSH..."
print_info "Connexion à ${GREEN}$REMOTE_USER@$REMOTE_SERVER${NC}..."
echo ""

# Créer le tunnel en arrière-plan
ssh -f -N -L ${TUNNEL_PORT}:localhost:3306 ${REMOTE_USER}@${REMOTE_SERVER}

# Vérifier si le tunnel a été créé
if [ $? -eq 0 ]; then
    sleep 2

    # Vérifier que le tunnel est bien actif
    if lsof -Pi :$TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║              🎉 TUNNEL SSH CRÉÉ AVEC SUCCÈS ! 🎉          ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        print_info "Configuration du tunnel:"
        echo -e "   ${GREEN}Port local:${NC}    $TUNNEL_PORT"
        echo -e "   ${GREEN}Port distant:${NC}  3306"
        echo -e "   ${GREEN}Serveur:${NC}       $REMOTE_USER@$REMOTE_SERVER"
        echo ""
        print_info "Utilisez cette DATABASE_URL dans votre .env:"
        echo -e "   ${YELLOW}DATABASE_URL=\"mysql://USER:PASSWORD@127.0.0.1:$TUNNEL_PORT/DATABASE_NAME\"${NC}"
        echo ""
        print_info "Commandes utiles:"
        echo -e "   ${YELLOW}Vérifier le tunnel:${NC} lsof -Pi :$TUNNEL_PORT"
        echo -e "   ${YELLOW}Arrêter le tunnel:${NC}  lsof -ti:$TUNNEL_PORT | xargs kill -9"
        echo ""
        print_success "Le tunnel restera actif en arrière-plan jusqu'à ce que vous l'arrêtiez"
    else
        print_error "Le tunnel n'a pas pu être vérifié"
        exit 1
    fi
else
    echo ""
    print_error "Impossible de créer le tunnel SSH"
    echo ""
    print_info "Vérifiez:"
    echo "  • Votre connexion internet"
    echo "  • Vos clés SSH (ssh-add -l)"
    echo "  • L'accès au serveur: ssh $REMOTE_USER@$REMOTE_SERVER"
    echo ""
    exit 1
fi
