#!/bin/bash

# Script de configuración inicial para instancia EC2
# Este script configura Docker, Docker Compose y otras dependencias

set -e

echo "🔧 Configurando instancia EC2 para despliegue..."

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias básicas
echo "📥 Instalando dependencias básicas..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    unzip

# Instalar Docker
echo "🐳 Instalando Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Agregar usuario ubuntu al grupo docker
    sudo usermod -aG docker ubuntu
    
    # Habilitar Docker para que se inicie automáticamente
    sudo systemctl enable docker
    sudo systemctl start docker
    
    echo "✅ Docker instalado correctamente"
else
    echo "✅ Docker ya está instalado"
fi

# Instalar Docker Compose
echo "🐙 Instalando Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose instalado correctamente"
else
    echo "✅ Docker Compose ya está instalado"
fi

# Instalar Node.js (para scripts locales)
echo "📦 Instalando Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    
    echo "✅ Node.js instalado correctamente"
else
    echo "✅ Node.js ya está instalado"
fi

# Configurar firewall
echo "🔥 Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp

# Crear directorios necesarios
echo "📁 Creando directorios..."
mkdir -p /home/ubuntu/despliegue-monolitico
mkdir -p /home/ubuntu/backups
mkdir -p /home/ubuntu/logs

# Configurar logrotate para logs de la aplicación
echo "📋 Configurando rotación de logs..."
sudo tee /etc/logrotate.d/despliegue-monolitico > /dev/null <<EOF
/home/ubuntu/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        docker-compose -f /home/ubuntu/despliegue-monolitico/docker-compose.prod.yml restart app
    endscript
}
EOF

# Configurar monitoreo básico con htop
echo "📊 Configurando monitoreo..."
sudo apt install -y htop iotop nethogs

# Crear script de monitoreo
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
echo "=== Estado del Sistema ==="
echo "Fecha: $(date)"
echo "Uptime: $(uptime)"
echo ""
echo "=== Uso de Disco ==="
df -h
echo ""
echo "=== Uso de Memoria ==="
free -h
echo ""
echo "=== Contenedores Docker ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== Logs de la Aplicación (últimas 10 líneas) ==="
docker logs despliegue_app_prod --tail 10 2>/dev/null || echo "Contenedor no encontrado"
EOF

chmod +x /home/ubuntu/monitor.sh

# Configurar cron job para limpieza automática
echo "⏰ Configurando limpieza automática..."
(crontab -l 2>/dev/null; echo "0 2 * * * docker system prune -f") | crontab -

# Configurar backup automático
echo "💾 Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 3 * * * /home/ubuntu/backup-db.sh") | crontab -

# Crear script de backup
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

mkdir -p $BACKUP_DIR

if docker ps | grep -q "despliegue_postgres_prod"; then
    docker exec despliegue_postgres_prod pg_dump -U postgres despliegue_monolitico > $BACKUP_FILE
    
    if [ $? -eq 0 ]; then
        gzip $BACKUP_FILE
        echo "$(date): Backup creado: $BACKUP_FILE.gz"
        
        # Mantener solo los últimos 7 backups
        cd $BACKUP_DIR
        ls -t backup_*.sql.gz | tail -n +8 | xargs -r rm
    else
        echo "$(date): Error creando backup"
    fi
else
    echo "$(date): Base de datos no disponible para backup"
fi
EOF

chmod +x /home/ubuntu/backup-db.sh

echo "✅ Configuración de EC2 completada"
echo ""
echo "📋 Resumen de la configuración:"
echo "  - Docker: $(docker --version)"
echo "  - Docker Compose: $(docker-compose --version)"
echo "  - Node.js: $(node --version)"
echo "  - Firewall: Configurado (SSH, HTTP, HTTPS, puerto 3000)"
echo "  - Directorios: /home/ubuntu/despliegue-monolitico, /home/ubuntu/backups"
echo "  - Monitoreo: /home/ubuntu/monitor.sh"
echo "  - Backup automático: Configurado"
echo "  - Limpieza automática: Configurada"
echo ""
echo "🚀 La instancia está lista para el despliegue"
echo "💡 Ejecuta './monitor.sh' para ver el estado del sistema"
