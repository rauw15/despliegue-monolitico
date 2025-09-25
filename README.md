# Despliegue Monolítico - Proyecto CI/CD

Este proyecto implementa un despliegue monolítico completo con flujo de CI/CD automatizado que incluye construcción de imágenes Docker y despliegue en AWS EC2.

## 🏗️ Arquitectura del Proyecto

```
├── src/
│   ├── app.js                 # Aplicación principal Express.js
│   ├── routes/                # Rutas de la API
│   ├── models/                # Modelos de base de datos
│   └── database/              # Configuración y scripts de BD
├── .github/workflows/         # Pipelines de CI/CD
├── scripts/                   # Scripts de despliegue
├── docker-compose.yml         # Configuración para desarrollo
├── docker-compose.prod.yml    # Configuración para producción
├── Dockerfile                 # Imagen Docker de la aplicación
└── nginx.conf                 # Configuración de Nginx
```

## 🚀 Características

- **API REST** con Express.js y Node.js
- **Base de datos PostgreSQL** con Sequelize ORM
- **Autenticación JWT** con bcrypt
- **Dockerización completa** con multi-stage builds
- **CI/CD automatizado** con GitHub Actions
- **Despliegue en AWS EC2** automatizado
- **Migraciones de base de datos** automáticas
- **Monitoreo y logging** integrado
- **Nginx como reverse proxy**
- **Seguridad** con Helmet, rate limiting y validaciones

## 📋 Requisitos Previos

### Para Desarrollo Local
- Node.js 18+
- Docker y Docker Compose
- Git

### Para Despliegue en Producción
- Cuenta de AWS con instancia EC2
- Docker Hub (para registro de imágenes)
- GitHub con repositorio configurado

## 🛠️ Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd despliegue-monolitico
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL=postgres://postgres:password@localhost:5432/despliegue_monolitico

# JWT
JWT_SECRET=tu-clave-secreta-super-segura

# Aplicación
NODE_ENV=development
PORT=3000
```

### 3. Instalar Dependencias

```bash
npm install
```

## 🏃‍♂️ Ejecución Local

### Desarrollo con Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Desarrollo sin Docker

```bash
# Instalar PostgreSQL localmente
# Crear base de datos: despliegue_monolitico

# Ejecutar migraciones
npm run migrate

# Poblar base de datos
npm run seed

# Iniciar aplicación
npm run dev
```

## 🧪 Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar con coverage
npm run test:coverage

# Ejecutar linter
npm run lint
```

## 🐳 Docker

### Construir Imagen

```bash
docker build -t despliegue-monolitico .
```

### Ejecutar Contenedor

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  -e JWT_SECRET=secret \
  despliegue-monolitico
```

## ☁️ Despliegue en AWS EC2

### 1. Configurar Instancia EC2

```bash
# Conectar a la instancia EC2
ssh -i tu-key.pem ubuntu@tu-ec2-ip

# Ejecutar script de configuración
curl -sSL https://raw.githubusercontent.com/tu-usuario/despliegue-monolitico/develop/scripts/setup-ec2.sh | bash
```

### 2. Configurar Secrets en GitHub

En tu repositorio de GitHub, ve a Settings > Secrets and variables > Actions y agrega:

```
DOCKER_USERNAME=tu-usuario-dockerhub
DOCKER_PASSWORD=tu-password-dockerhub
EC2_SSH_PRIVATE_KEY=tu-clave-privada-ec2
EC2_USER=ubuntu
EC2_HOST=tu-ip-ec2
POSTGRES_PASSWORD=tu-password-postgres
JWT_SECRET=tu-jwt-secret
SNYK_TOKEN=tu-token-snyk (opcional)
```

### 3. Configurar Ramas Protegidas

1. Ve a Settings > Branches en tu repositorio
2. Agrega una regla para la rama `develop`:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict pushes that create files

### 4. Flujo de Trabajo

1. **Crear Pull Request** a la rama `develop`
2. **Revisar código** y aprobar PR
3. **Merge a develop** dispara el pipeline automáticamente
4. **Despliegue automático** a EC2

## 🔄 Pipeline CI/CD

### Workflows Incluidos

#### 1. CI/CD Principal (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push a `develop` o `main`
- Pull Request a `develop`

**Jobs:**
- **Test**: Ejecuta pruebas y linter
- **Build**: Construye y publica imagen Docker
- **Deploy**: Despliega a EC2 (solo en `develop`)
- **Notify**: Notifica resultado del despliegue

#### 2. Security Scan (`.github/workflows/security-scan.yml`)

**Triggers:**
- Push a `develop` o `main`
- Pull Request a `develop`
- Programado: Lunes 2 AM

**Jobs:**
- **Dependency Scan**: NPM audit y Snyk
- **Docker Scan**: Trivy vulnerability scanner
- **CodeQL**: Análisis de código con GitHub

## 📊 Monitoreo y Logs

### Verificar Estado de la Aplicación

```bash
# En la instancia EC2
./monitor.sh

# Ver logs de la aplicación
docker logs despliegue_app_prod -f

# Ver logs de todos los servicios
docker-compose -f docker-compose.prod.yml logs -f
```

### Endpoints de Monitoreo

```bash
# Salud básica
curl http://tu-ec2-ip/api/health

# Salud detallada (solo desarrollo)
curl http://tu-ec2-ip/api/health/detailed
```

## 🗄️ Base de Datos

### Migraciones

```bash
# Ejecutar migraciones
npm run migrate

# Rollback (cuidado en producción)
npm run rollback
```

### Backup y Restore

```bash
# Backup manual
docker exec despliegue_postgres_prod pg_dump -U postgres despliegue_monolitico > backup.sql

# Restore
docker exec -i despliegue_postgres_prod psql -U postgres despliegue_monolitico < backup.sql
```

### Backup Automático

El sistema configura backups automáticos diarios a las 3 AM en `/home/ubuntu/backups/`

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Iniciar en modo desarrollo
npm run dev

# Ejecutar migraciones
npm run migrate

# Poblar base de datos
npm run seed

# Ejecutar pruebas
npm test
```

### Docker

```bash
# Construir imagen
docker build -t despliegue-monolitico .

# Ejecutar contenedor
docker run -p 3000:3000 despliegue-monolitico

# Ver logs
docker logs <container-id> -f

# Entrar al contenedor
docker exec -it <container-id> /bin/sh
```

### Producción

```bash
# En EC2 - Ver estado
./monitor.sh

# En EC2 - Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# En EC2 - Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# En EC2 - Backup manual
./backup-db.sh
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar que PostgreSQL esté ejecutándose
docker ps | grep postgres

# Verificar logs de PostgreSQL
docker logs despliegue_postgres_prod
```

#### 2. Error en Despliegue

```bash
# Ver logs del pipeline en GitHub Actions
# Verificar secrets configurados
# Verificar conectividad SSH a EC2
```

#### 3. Aplicación No Responde

```bash
# Verificar estado de contenedores
docker ps

# Ver logs de la aplicación
docker logs despliegue_app_prod

# Verificar puertos
netstat -tlnp | grep 3000
```

### Logs Importantes

```bash
# Logs de aplicación
/var/log/despliegue-monolitico-deploy.log

# Logs de Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log

# Logs de Docker
journalctl -u docker.service
```

## 🔒 Seguridad

### Medidas Implementadas

- **Helmet.js** para headers de seguridad
- **Rate limiting** con express-rate-limit
- **Validación de entrada** en todas las rutas
- **JWT** para autenticación
- **Bcrypt** para hash de contraseñas
- **CORS** configurado
- **Firewall** configurado en EC2
- **Escaneo de vulnerabilidades** automatizado

### Configuración de Seguridad

```bash
# Verificar configuración de firewall
sudo ufw status

# Verificar logs de seguridad
sudo journalctl -u ssh
```

## 📈 Optimizaciones

### Rendimiento

- **Compresión gzip** en Nginx
- **Pool de conexiones** a PostgreSQL
- **Cache headers** configurados
- **Health checks** para Docker

### Escalabilidad

- **Nginx** como load balancer
- **Docker Swarm** ready (configuración adicional)
- **Base de datos externa** (RDS) compatible

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte y preguntas:

- Crear un issue en GitHub
- Revisar la documentación
- Verificar logs del sistema

## 🎯 Roadmap

- [ ] Implementar cache con Redis
- [ ] Agregar métricas con Prometheus
- [ ] Configurar alertas con Grafana
- [ ] Implementar blue-green deployment
- [ ] Agregar tests de integración
- [ ] Configurar SSL/TLS automático
