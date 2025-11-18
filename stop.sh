#!/bin/bash

# =========================================
#  DigiWeb ERP - Arrêt automatique
# =========================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}         ${YELLOW}⏹  DigiWeb ERP - Arrêt des serveurs${NC}            ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

PID_FILE="/tmp/digiweb_erp_pids.txt"
STOPPED=false

# Arrêter via le fichier PID
if [ -f $PID_FILE ]; then
    print_warning "Arrêt des serveurs via fichier PID..."
    source $PID_FILE

    if [ ! -z "$SERVER" ]; then
        kill $SERVER 2>/dev/null
        if [ $? -eq 0 ]; then
            print_success "Serveur Next.js arrêté (PID: $SERVER)"
            STOPPED=true
        fi
    fi

    rm $PID_FILE
fi

# Arrêter les processus sur les ports
FRONTEND_PORT=3000

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Arrêt du processus sur le port $FRONTEND_PORT..."
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
    print_success "Port $FRONTEND_PORT libéré"
    STOPPED=true
fi

# Fermer les tunnels SSH éventuels
TUNNEL_PORT=3307
if lsof -Pi :$TUNNEL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Fermeture du tunnel SSH..."
    lsof -ti:$TUNNEL_PORT | xargs kill -9 2>/dev/null
    print_success "Tunnel SSH fermé"
fi

# Message final
echo ""
if [ "$STOPPED" = true ]; then
    echo -e "${GREEN}✨ Application arrêtée avec succès${NC}"
else
    print_warning "Aucun serveur en cours d'exécution"
fi

echo ""
