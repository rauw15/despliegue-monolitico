#!/bin/bash

# Script de despliegue para EC2
# Este script se ejecuta en la instancia EC2 para desplegar la aplicación

set -e  # Salir si cualquier comando falla

echo "🚀 Iniciando despliegue..."

# Variables de entorno requeridas
REQUIRED_VARS=("DOCKER_IMAGE" "POSTGRES_PASSWORD" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: La variable $var no está definida"
        exit 1
    fi
done

# Configuración
APP_NAME="despliegue-monolitico"
COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/home/ubuntu/backups"
LOG_FILE="/var/log/${APP_NAME}-deploy.log"

# Crear directorio de logs si no existe
sudo mkdir -p /var/log
sudo touch $LOG_FILE
sudo chown ubuntu:ubuntu $LOG_FILE

# Función para logging
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

log "📋 Iniciando despliegue de $APP_NAME"

# Verificar que Docker esté instalado y ejecutándose
if ! command -v docker &> /dev/null; then
    log "❌ Docker no está instalado"
    exit 1
fi

if ! docker info &> /dev/null; then
    log "❌ Docker no está ejecutándose"
    exit 1
fi

# Verificar que Docker Compose esté instalado
if ! command -v docker-compose &> /dev/null; then
    log "❌ Docker Compose no está instalado"
    exit 1
fi

# Crear directorio de backup si no existe
mkdir -p $BACKUP_DIR

# Backup de la base de datos actual (si existe)
if docker ps | grep -q "${APP_NAME}_postgres"; then
    log "💾 Creando backup de la base de datos..."
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    docker exec "${APP_NAME}_postgres_prod" pg_dump -U postgres despliegue_monolitico > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        log "✅ Backup creado: $BACKUP_FILE"
        
        # Mantener solo los últimos 5 backups
        cd $BACKUP_DIR
        ls -t backup_*.sql | tail -n +6 | xargs -r rm
    else
        log "⚠️  No se pudo crear el backup, continuando..."
    fi
fi

# Detener contenedores existentes
log "🛑 Deteniendo contenedores existentes..."
docker-compose -f $COMPOSE_FILE down || true

# Limpiar imágenes huérfanas
log "🧹 Limpiando imágenes huérfanas..."
docker image prune -f

# Descargar la nueva imagen
log "📥 Descargando imagen: $DOCKER_IMAGE"
docker pull $DOCKER_IMAGE

if [ $? -ne 0 ]; then
    log "❌ Error descargando la imagen Docker"
    exit 1
fi

# Iniciar los servicios
log "🔄 Iniciando servicios..."
docker-compose -f $COMPOSE_FILE up -d

# Esperar a que los servicios estén listos
log "⏳ Esperando a que los servicios estén listos..."
sleep 30

# Verificar que los contenedores estén ejecutándose
if ! docker ps | grep -q "${APP_NAME}_app_prod"; then
    log "❌ El contenedor de la aplicación no está ejecutándose"
    docker-compose -f $COMPOSE_FILE logs app
    exit 1
fi

# Ejecutar migraciones de base de datos
log "🗄️  Ejecutando migraciones..."
docker exec "${APP_NAME}_app_prod" npm run migrate

if [ $? -eq 0 ]; then
    log "✅ Migraciones ejecutadas exitosamente"
else
    log "⚠️  Error en las migraciones, pero continuando..."
fi

# Verificar salud de la aplicación
log "🔍 Verificando salud de la aplicación..."
for i in {1..10}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Aplicación respondiendo correctamente"
        break
    else
        log "⏳ Intento $i/10 - Esperando respuesta de la aplicación..."
        sleep 10
    fi
    
    if [ $i -eq 10 ]; then
        log "❌ La aplicación no responde después de 100 segundos"
        docker-compose -f $COMPOSE_FILE logs app
        exit 1
    fi
done

# Configurar Nginx (si está configurado)
if [ -f "nginx.conf" ]; then
    log "🌐 Configurando Nginx..."
    docker-compose -f $COMPOSE_FILE restart nginx
fi

# Limpiar recursos no utilizados
log "🧹 Limpiando recursos Docker..."
docker system prune -f

log "✅ Despliegue completado exitosamente"
log "🌍 Aplicación disponible en: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

# Mostrar estado final
log "📊 Estado de los contenedores:"
docker-compose -f $COMPOSE_FILE ps
