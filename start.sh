#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_port() {
    local port=$1
    local service=$2
    if ss -tlnp "sport = :$port" 2>/dev/null | grep -q ":$port"; then
        log_info "Port $port ($service) is available"
        return 0
    else
        log_warn "Port $port ($service) is not listening"
        return 1
    fi
}

check_docker() {
    if ! command -v docker &>/dev/null; then
        log_error "Docker is not installed"
        return 1
    fi
    log_info "Docker is installed"
}

check_docker_container() {
    local container=$1
    local status
    status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || true)
    if [ "$status" = "running" ]; then
        log_info "Docker container '$container' is running"
        return 0
    else
        log_warn "Docker container '$container' is not running (status: ${status:-not found})"
        return 1
    fi
}

postgres_up=false
frontend_up=false
backend_up=false

echo "========================================"
echo "  School Management System - Startup"
echo "========================================"
echo ""

log_info "Checking prerequisites..."

check_docker

echo ""

log_info "Checking port availability..."
check_port 5433 "PostgreSQL" && postgres_up=true
check_port 8000 "Backend (Laravel)" && backend_up=true
check_port 3000 "Frontend (React/Vite)" && frontend_up=true

echo ""

log_info "Checking Docker containers..."
check_docker_container "school_pg" && postgres_up=true

echo ""

if [ "$postgres_up" = false ]; then
    log_info "Starting PostgreSQL container..."
    docker start school_pg 2>/dev/null || docker run -d --name school_pg \
        -p 5433:5432 \
        -e POSTGRES_DB=school_mgmt \
        -e POSTGRES_USER=school_user \
        -e POSTGRES_PASSWORD=school_pass \
        postgres:16-alpine
    sleep 2
    if docker inspect --format='{{.State.Status}}' school_pg 2>/dev/null | grep -q "running"; then
        postgres_up=true
        log_info "PostgreSQL container started"
    else
        log_error "Failed to start PostgreSQL container"
    fi
fi

echo ""

if [ "$postgres_up" = true ]; then
    log_info "Waiting for PostgreSQL to accept connections..."
    for i in $(seq 1 15); do
        if docker exec school_pg pg_isready -U school_user -d school_mgmt &>/dev/null; then
            log_info "PostgreSQL is ready"
            break
        fi
        sleep 1
    done

    log_info "Running database migrations..."
    cd "$BACKEND_DIR" && php artisan migrate --force 2>&1 | tail -1
fi

echo ""

if [ "$backend_up" = false ]; then
    log_info "Starting Laravel backend on port 8000..."
    cd "$BACKEND_DIR"
    nohup php artisan serve --port=8000 --host=0.0.0.0 > "$ROOT_DIR/storage/logs/backend.log" 2>&1 &
    BACKEND_PID=$!
    log_info "Backend started (PID: $BACKEND_PID)"
else
    log_info "Backend is already running"
fi

echo ""

if [ "$frontend_up" = false ]; then
    log_info "Starting React frontend on port 3000..."
    cd "$FRONTEND_DIR"
    nohup npm run dev > "$ROOT_DIR/storage/logs/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    log_info "Frontend started (PID: $FRONTEND_PID)"
else
    log_info "Frontend is already running"
fi

echo ""
echo "========================================"
echo "  Summary"
echo "========================================"
echo "  PostgreSQL : ${postgres_up} (port 5433)"
echo "  Backend    : http://localhost:8000"
echo "  Frontend   : http://localhost:3000"
echo ""
echo "  Backend logs : storage/logs/backend.log"
echo "  Frontend logs: storage/logs/frontend.log"
echo "========================================"
