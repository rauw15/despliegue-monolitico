# Guía de Despliegue - Despliegue Monolítico

Esta guía detalla paso a paso cómo configurar y desplegar el proyecto en un entorno de producción en AWS EC2.

## 🎯 Objetivos del Despliegue

- ✅ Configurar flujo CI/CD automatizado
- ✅ Construir y publicar imágenes Docker
- ✅ Desplegar automáticamente en EC2
- ✅ Ejecutar migraciones de base de datos
- ✅ Proteger ramas con Pull Requests
- ✅ Implementar monitoreo y logging

## 📋 Checklist de Preparación

### 1. Cuenta de AWS
- [ ] Cuenta AWS activa
- [ ] EC2 Instance creada (Ubuntu 20.04+)
- [ ] Security Groups configurados (SSH, HTTP, HTTPS)
- [ ] Key Pair descargada

### 2. Cuenta de Docker Hub
- [ ] Cuenta Docker Hub creada
- [ ] Username y password disponibles

### 3. Repositorio GitHub
- [ ] Repositorio creado
- [ ] Código subido
- [ ] Ramas `main` y `develop` creadas

## 🚀 Pasos de Configuración

### Paso 1: Configurar Instancia EC2

#### 1.1 Crear Instancia EC2

```bash
# Especificaciones recomendadas:
# - AMI: Ubuntu Server 20.04 LTS
# - Instance Type: t3.micro (para pruebas) / t3.small (producción)
# - Storage: 20 GB gp3
# - Security Groups: SSH (22), HTTP (80), HTTPS (443), Custom (3000)
```

#### 1.2 Conectar a la Instancia

```bash
ssh -i tu-key.pem ubuntu@tu-ec2-public-ip
```

#### 1.3 Configurar la Instancia

```bash
# Descargar y ejecutar script de configuración
curl -sSL https://raw.githubusercontent.com/tu-usuario/despliegue-monolitico/develop/scripts/setup-ec2.sh | bash

# O ejecutar manualmente:
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git curl
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker
```

### Paso 2: Configurar GitHub Secrets

En tu repositorio GitHub, ve a `Settings > Secrets and variables > Actions` y agrega:

```bash
# Docker Hub
DOCKER_USERNAME=tu-usuario-dockerhub
DOCKER_PASSWORD=tu-password-dockerhub

# EC2
EC2_SSH_PRIVATE_KEY=contenido-completo-de-tu-key.pem
EC2_USER=ubuntu
EC2_HOST=tu-ec2-public-ip

# Base de Datos
POSTGRES_PASSWORD=password-super-seguro-para-postgres

# JWT
JWT_SECRET=jwt-secret-key-muy-segura-y-larga

# Opcional - Snyk para seguridad
SNYK_TOKEN=tu-token-snyk
```

### Paso 3: Configurar Ramas Protegidas

#### 3.1 Proteger Rama `develop`

1. Ve a `Settings > Branches`
2. Click en `Add rule`
3. Branch name pattern: `develop`
4. Configurar reglas:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict pushes that create files

#### 3.2 Proteger Rama `main`

1. Agregar otra regla para `main`
2. Configurar las mismas reglas que `develop`

### Paso 4: Configurar Docker Hub

#### 4.1 Crear Repositorio en Docker Hub

1. Login a Docker Hub
2. Click en `Create Repository`
3. Nombre: `despliegue-monolitico`
4. Visibility: Private (recomendado)

#### 4.2 Configurar Autobuild (Opcional)

```bash
# En Docker Hub, conectar con GitHub
# Configurar autobuild para rama develop
```

## 🔄 Flujo de Trabajo

### Desarrollo Normal

1. **Crear Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/nueva-funcionalidad
   ```

2. **Desarrollar y Commit**
   ```bash
   # Hacer cambios
   git add .
   git commit -m "feat: agregar nueva funcionalidad"
   git push origin feature/nueva-funcionalidad
   ```

3. **Crear Pull Request**
   - Ir a GitHub
   - Crear PR de `feature/nueva-funcionalidad` a `develop`
   - Revisar código
   - Aprobar y merge

4. **Despliegue Automático**
   - Al hacer merge a `develop`, se dispara el pipeline
   - Se ejecutan tests automáticamente
   - Se construye imagen Docker
   - Se despliega en EC2
   - Se ejecutan migraciones

### Rollback en Caso de Problemas

```bash
# Conectar a EC2
ssh -i tu-key.pem ubuntu@tu-ec2-ip

# Ir al directorio del proyecto
cd ~/despliegue-monolitico

# Hacer rollback a versión anterior
docker-compose -f docker-compose.prod.yml down
docker pull tu-usuario/despliegue-monolitico:tag-anterior
export DOCKER_IMAGE=tu-usuario/despliegue-monolitico:tag-anterior
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoreo Post-Despliegue

### Verificar Despliegue

```bash
# En EC2
./monitor.sh

# Verificar aplicación
curl http://tu-ec2-ip/api/health

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Métricas Importantes

- **Uptime**: `uptime`
- **Memoria**: `free -h`
- **Disco**: `df -h`
- **Contenedores**: `docker ps`
- **Logs de aplicación**: `docker logs despliegue_app_prod`

## 🔧 Troubleshooting

### Problemas Comunes

#### 1. Pipeline Falla en Tests

```bash
# Verificar en GitHub Actions
# Revisar logs del job "test"
# Ejecutar tests localmente:
npm test
```

#### 2. Error de Construcción Docker

```bash
# Verificar Dockerfile
# Verificar .dockerignore
# Probar construcción local:
docker build -t test .
```

#### 3. Error de Despliegue en EC2

```bash
# Verificar conectividad SSH
ssh -i tu-key.pem ubuntu@tu-ec2-ip

# Verificar secrets en GitHub
# Verificar que la instancia tenga Docker instalado
```

#### 4. Aplicación No Responde

```bash
# En EC2
docker ps
docker logs despliegue_app_prod
curl localhost:3000/api/health

# Verificar puertos
sudo netstat -tlnp | grep 3000
```

#### 5. Error de Base de Datos

```bash
# Verificar PostgreSQL
docker ps | grep postgres
docker logs despliegue_postgres_prod

# Verificar conexión
docker exec -it despliegue_postgres_prod psql -U postgres -d despliegue_monolitico
```

## 🚨 Alertas y Notificaciones

### Configurar Alertas (Opcional)

```bash
# Slack Webhook
# Discord Webhook
# Email notifications
```

### Logs Importantes

```bash
# Logs de despliegue
/var/log/despliegue-monolitico-deploy.log

# Logs de Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# Logs de Docker
journalctl -u docker.service
```

## 🔒 Seguridad Post-Despliegue

### Verificaciones de Seguridad

```bash
# Firewall
sudo ufw status

# Logs de SSH
sudo journalctl -u ssh

# Procesos ejecutándose
ps aux | grep node

# Conexiones de red
netstat -tulpn
```

### Backup y Recovery

```bash
# Backup automático configurado
# Verificar backups:
ls -la /home/ubuntu/backups/

# Restore manual:
./backup-db.sh
```

## 📈 Optimizaciones de Producción

### Configuraciones Recomendadas

1. **SSL/TLS**
   ```bash
   # Usar Let's Encrypt
   # Configurar certificados en nginx.conf
   ```

2. **Base de Datos Externa**
   ```bash
   # Usar AWS RDS
   # Configurar DATABASE_URL
   ```

3. **Load Balancer**
   ```bash
   # Usar AWS ALB
   # Configurar health checks
   ```

4. **Monitoring**
   ```bash
   # CloudWatch
   # Prometheus + Grafana
   ```

## ✅ Checklist de Verificación

### Pre-Despliegue
- [ ] Tests pasan localmente
- [ ] Docker build funciona
- [ ] Variables de entorno configuradas
- [ ] Secrets en GitHub configurados
- [ ] EC2 configurado y accesible

### Post-Despliegue
- [ ] Aplicación responde en `/api/health`
- [ ] Base de datos conectada
- [ ] Logs sin errores
- [ ] Backup automático funcionando
- [ ] Monitoreo configurado

### Verificación Continua
- [ ] Pipeline ejecutándose en cada PR
- [ ] Despliegue automático funcionando
- [ ] Rollback procedure documentado
- [ ] Alertas configuradas
- [ ] Documentación actualizada

## 📞 Soporte

En caso de problemas:

1. **Revisar logs** en GitHub Actions y EC2
2. **Verificar configuración** de secrets y variables
3. **Probar conectividad** SSH y HTTP
4. **Revisar documentación** del proyecto
5. **Crear issue** en GitHub con detalles del error
