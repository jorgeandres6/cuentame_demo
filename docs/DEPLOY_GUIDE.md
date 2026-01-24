# 🚀 GUÍA DE DESPLIEGUE A AZURE - CUÉNTAME

## 📋 Requisitos Previos

- [x] Azure SQL Database creada
- [x] Usuarios demo insertados (`npm run seed`)
- [x] Aplicación funcionando en localhost
- [x] Azure CLI instalado
- [x] Credenciales de Azure configuradas

---

## 🔧 Paso 1: Preparar la Aplicación

### 1.1 Build del Frontend
```bash
npm run build
```
Esto crea la carpeta `/dist` con los archivos optimizados.

### 1.2 Verificar que todo funciona localmente
```bash
# Terminal 1
npm run dev:server

# Terminal 2  
npm run dev
```

### 1.3 Validar endpoints
```bash
curl http://localhost:3000/api/health
# Respuesta: {"status":"ok"}
```

---

## ☁️ Paso 2: Crear Recursos en Azure

### 2.1 Crear Grupo de Recursos
```bash
az group create \
  --name cuentame-rg \
  --location eastus
```

### 2.2 Crear Plan de App Service
```bash
az appservice plan create \
  --name cuentame-plan \
  --resource-group cuentame-rg \
  --sku B1 \
  --is-linux
```

### 2.3 Crear App Service
```bash
az webapp create \
  --resource-group cuentame-rg \
  --plan cuentame-plan \
  --name cuentame-app \
  --runtime "node|18"
```

**Nota:** Reemplazar `cuentame-app` con un nombre único (aparecerá como `cuentame-app.azurewebsites.net`)

---

## 🔐 Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo de configuración
```bash
az webapp config appsettings set \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --settings \
  AZURE_SQL_SERVER="cuentame-server-XXX.database.windows.net" \
  AZURE_SQL_DATABASE="cuentame_db" \
  AZURE_SQL_USER="cuentame_admin" \
  AZURE_SQL_PASSWORD="tu-password-fuerte" \
  REACT_APP_API_URL="https://cuentame-app.azurewebsites.net" \
  GEMINI_API_KEY="tu-gemini-key" \
  NODE_ENV="production" \
  PORT="8080"
```

### 3.2 Verificar configuración
```bash
az webapp config appsettings list \
  --resource-group cuentame-rg \
  --name cuentame-app
```

---

## 📦 Paso 4: Desplegar Código

### Opción A: Deployment desde Git (Recomendado)

#### A.1 Inicializar repositorio Git
```bash
git init
git add .
git commit -m "Initial commit: Azure SQL integration"
```

#### A.2 Crear credenciales de despliegue
```bash
az webapp deployment user set \
  --user-name cuentame-deployer \
  --password Tu-Password-Fuerte-123
```

#### A.3 Obtener URL de Git
```bash
az webapp deployment source config-local-git \
  --resource-group cuentame-rg \
  --name cuentame-app
```

Respuesta: `https://cuentame-deployer@cuentame-app.scm.azurewebsites.net/cuentame-app.git`

#### A.4 Configurar Git remoto
```bash
git remote add azure https://cuentame-deployer@cuentame-app.scm.azurewebsites.net/cuentame-app.git
git push azure main
```

---

### Opción B: Deployment desde ZIP

#### B.1 Crear archivo ZIP
```bash
# Windows (PowerShell)
Compress-Archive -Path * -DestinationPath app.zip

# Linux/Mac (Bash)
zip -r app.zip . -x "node_modules/*" ".git/*" ".env*"
```

#### B.2 Desplegar ZIP
```bash
az webapp deployment source config-zip \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --src app.zip
```

---

## ✅ Paso 5: Verificar Despliegue

### 5.1 Health Check
```bash
curl https://cuentame-app.azurewebsites.net/api/health
# Respuesta: {"status":"ok"}
```

### 5.2 Probar Login
```bash
curl -X POST https://cuentame-app.azurewebsites.net/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-2026-A","password":"123"}'
```

### 5.3 Obtener Casos
```bash
curl https://cuentame-app.azurewebsites.net/api/cases
```

### 5.4 Acceder en Navegador
```
https://cuentame-app.azurewebsites.net
```

---

## 🔍 Paso 6: Monitoreo y Logs

### 6.1 Ver logs en tiempo real
```bash
az webapp log tail \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --provider application
```

### 6.2 Habilitar logs detallados
```bash
az webapp log config \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --web-server-logging filesystem \
  --level information
```

### 6.3 Descargar logs
```bash
az webapp log download \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --log-file logs.zip
```

---

## 🐛 Troubleshooting

### Error: "Application Error"
```bash
# Ver logs
az webapp log tail --resource-group cuentame-rg --name cuentame-app

# Reiniciar aplicación
az webapp restart --resource-group cuentame-rg --name cuentame-app
```

### Error: "Cannot connect to database"
```bash
# Verificar credenciales en settings
az webapp config appsettings list \
  --resource-group cuentame-rg \
  --name cuentame-app

# Verificar firewall de SQL
# En Azure Portal → SQL Server → Firewall
# Asegurarse que "Allow Azure services and resources to access this server" está ON
```

### Error: "Build failed"
```bash
# Limpiar caché
az webapp deployment slot create \
  --name cuentame-app \
  --resource-group cuentame-rg \
  --slot staging

# Hacer pull
git push azure main --force
```

---

## 📊 Monitoreo en Producción

### 6.1 Crear alerta para CPU
```bash
az monitor metrics alert create \
  --name "High CPU Alert" \
  --resource-group cuentame-rg \
  --scopes "/subscriptions/[subscription-id]/resourceGroups/cuentame-rg/providers/Microsoft.Web/serverfarms/cuentame-plan" \
  --condition "avg Percentage CPU > 80" \
  --window-size 5m
```

### 6.2 Habilitar Application Insights
```bash
az monitor app-insights component create \
  --app cuentame-insights \
  --location eastus \
  --resource-group cuentame-rg \
  --application-type web
```

---

## 🔄 Actualizar Aplicación

### Después de cambios locales:
```bash
# Compilar nuevamente
npm run build

# Si usas Git
git add .
git commit -m "Update: descripción del cambio"
git push azure main

# O si usas ZIP
zip -r app.zip . -x "node_modules/*" ".git/*" ".env*"
az webapp deployment source config-zip \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --src app.zip
```

---

## 💰 Costos Estimados

| Recurso | SKU | Costo Mensual |
|---------|-----|--------------|
| SQL Database | DTU Básico 5 | ~$5 USD |
| App Service | B1 (1 GB RAM) | ~$12 USD |
| Data Transfer | Salida | ~$0-2 USD |
| **TOTAL** | | **~$17-19 USD/mes** |

---

## 🔒 Seguridad en Producción

### Checklist de Seguridad
- [ ] Cambiar contraseña de admin de SQL
- [ ] Habilitar firewall de Azure SQL
- [ ] Usar Azure Key Vault para credenciales
- [ ] Habilitar HTTPS obligatorio
- [ ] Configurar CORS correctamente
- [ ] Implementar rate limiting
- [ ] Habilitar auditoría de base de datos
- [ ] Configurar backups automáticos
- [ ] Usar Azure AD para autenticación

### Habilitar HTTPS obligatorio
```bash
az webapp update \
  --resource-group cuentame-rg \
  --name cuentame-app \
  --https-only true
```

---

## 📝 Notas Importantes

1. **Puerto:** Azure usa puerto 8080 por defecto. El server.js detecta esto automáticamente.

2. **Tiempo de build:** Primera vez puede tomar 5-10 minutos.

3. **Cold start:** La aplicación puede tardar un poco en responder después de inactividad.

4. **Límites de almacenamiento:** Plan B1 tiene 500 MB de almacenamiento. Suficiente para la app + pequeña BD.

5. **Base de datos:** Aunque App Service está en US East, la base de datos debe estar en la misma región para latencia mínima.

---

## ✅ Checklist Final

- [ ] Azure SQL Database creada y accesible
- [ ] Tablas creadas con `npm run seed`
- [ ] Plan y App Service creados
- [ ] Variables de entorno configuradas
- [ ] Código compilado (`npm run build`)
- [ ] Despliegue realizado (Git o ZIP)
- [ ] Health check responde correctamente
- [ ] Login funciona
- [ ] Casos se guardan en BD
- [ ] Logs sin errores

---

**Una vez completado:** La aplicación estará disponible en:
```
https://cuentame-app.azurewebsites.net
```

Para preguntas o problemas, revisar Azure Portal → cuentame-app → Logs.
