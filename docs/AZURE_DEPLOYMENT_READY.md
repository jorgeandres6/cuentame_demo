# 📦 AZURE DEPLOYMENT READY - Complete Configuration

**Status:** ✅ **Ready for Azure Deployment**

---

## 📋 Cambios Realizados para Azure Oryx

### ✅ 1. Archivo `.nvmrc` (NUEVO)
```
24
```
**Por qué:** Oryx detecta automáticamente versiones de Node via este archivo

---

### ✅ 2. Archivo `.deploymentrc` (NUEVO)
```json
{
  "version": 1,
  "buildProperties": {
    "nodejs": {
      "version": "24"
    }
  },
  "components": {
    "nodejs": true,
    "npm": true
  }
}
```
**Por qué:** Configuración explícita para que Oryx sepa que es Node.js

---

### ✅ 3. Archivo `.deployment` (ACTUALIZADO)
```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT=true
PROJECT=.
DEPLOYMENT_SOURCE=.
NODEJS_VERSION=24
```
**Por qué:** Instrucciones para Azure App Service

---

### ✅ 4. Archivo `startup.sh` (NUEVO)
Script bash que:
1. Verifica Node.js y NPM
2. Ejecuta `npm ci --production`
3. Ejecuta `npm run build` (Vite)
4. Verifica que `server.js` existe
5. Inicia con `npm start`

**Por qué:** Control total del proceso de build y startup

---

## 🔄 Flujo Actual (Antes de los Cambios)

```
Azure Deploy
  ↓
Oryx intenta detectar plataforma
  ↓
❌ "Couldn't detect a version for the platform 'nodejs'"
  ↓
BUILD FALLA
```

---

## ✅ Flujo Nuevo (Después de los Cambios)

```
Azure Deploy
  ↓
Oryx lee .nvmrc → Detecta Node.js 24 ✓
Oryx lee .deploymentrc → Configura componentes ✓
  ↓
Instala Node.js 24
Instala dependencias (npm ci)
  ↓
Ejecuta npm run build (Vite compila React)
  ↓
Ejecuta startup.sh
  ↓
npm start (inicia server.js)
  ↓
✅ APP ONLINE EN AZURE
```

---

## 📂 Estructura del Proyecto (Relevante para Azure)

```
cuentame_demo/
├── .nvmrc                    ← 24 (versión Node)
├── .deploymentrc             ← Config para Oryx
├── .deployment               ← Config para Azure
├── startup.sh                ← Script de inicio
├── package.json              ← Dependencias (NPM)
├── package-lock.json         ← Lock para reproducibilidad
├── server.js                 ← API server (Express)
├── vite.config.ts            ← Config build React
├── tsconfig.json             ← Config TypeScript
├── web.config                ← Config IIS
├── dist/                     ← Output del build (Vite)
├── components/               ← React components
├── services/                 ← API services
└── ...otros archivos
```

---

## 🎯 Pasos para Hacer Deploy

### Paso 1: Preparar Código
```bash
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

# Verificar que los archivos existen
ls -la .nvmrc .deploymentrc startup.sh

# Compilar localmente para verificar
npm run build
npm start
```

### Paso 2: Git Commit
```bash
git add .nvmrc .deploymentrc startup.sh .deployment
git commit -m "Add Azure Oryx configuration for Node.js deployment"
git push origin main
```

### Paso 3: Azure Configuration

**En Azure Portal:**
1. Abre tu **App Service**
2. Ve a **Settings** → **Configuration**
3. En la pestaña **Application settings**, agrega:
   ```
   NODEJS_VERSION = 24
   WEBSITE_NODE_DEFAULT_VERSION = 24
   ```
4. Click **Save**

### Paso 4: Redeploy

**Opción A: Automático (Git-connected)**
```bash
git push origin main
# Automáticamente dispara deployment
```

**Opción B: Manual desde Portal**
- Abre **Deployment Center**
- Click "Sync" o "Deploy"

**Opción C: Azure CLI**
```bash
az webapp deployment source config-zip \
  --resource-group <tu-grupo> \
  --name <tu-app> \
  --src cuentame-deploy.zip
```

---

## ✅ Checklist Pre-Deploy

```
CÓDIGO:
  ✓ .nvmrc existe con "24"
  ✓ .deploymentrc bien formado
  ✓ .deployment actualizado
  ✓ startup.sh creado
  ✓ package.json en raíz
  ✓ server.js escucha PORT env var

GIT:
  ✓ Cambios commiteados
  ✓ Push a rama main/master

AZURE:
  □ App Service creado
  □ SQL Server configurado (si es necesario)
  □ Variables de entorno configuradas
  □ NODEJS_VERSION = 24

DEPLOY:
  □ Deployment ejecutado
  □ Logs sin errores
  □ App está ONLINE
```

---

## 🔍 Qué Esperar en Logs

**Logs de Azure después de push:**

```
Receiving pushs
Updating branch
Running custom deployment command
Running Oryx build...

Detecting platforms...
Found node version from .nvmrc: 24
Using Node.js version: 24

npm version: 10.x.x
node version: v24.x.x

Installing dependencies...
npm install --production --prefer-offline --no-audit

> npm run build

vite v6.x.x building for production
✓ 916 modules transformed
✓ built in 10.54s

Server starting on port: 8080
✓ App online
```

---

## 🆘 Si Falla

### Error 1: "Still can't detect nodejs"
```bash
# Solución: Asegúrate que .nvmrc, .deploymentrc y .deployment existan
# y estén commiteados en Git
git status
git add .nvmrc .deploymentrc .deployment
git commit -m "Fix: Azure configuration files"
git push
```

### Error 2: "npm ci failed"
```bash
# En Application Settings, agrega:
npm_config_loglevel = verbose
NPM_CONFIG_LEGACY_PEER_DEPS = true
```

### Error 3: "npm run build failed"
```bash
# Verifica que Vite compile localmente:
npm run build

# Si hay errores, llénalos primero
# Luego haz push a Azure
```

### Error 4: "Port already in use"
```bash
# El server.js debe usar process.env.PORT
// ✓ Correcto:
app.listen(process.env.PORT || 3000)

// ✗ Incorrecto:
app.listen(3000)
```

---

## 📊 Resumen de Cambios

| Archivo | Acción | Razón |
|---------|--------|-------|
| `.nvmrc` | CREAR | Detectar Node.js 24 |
| `.deploymentrc` | CREAR | Config Oryx explícita |
| `.deployment` | ACTUALIZAR | Especificar NODEJS_VERSION |
| `startup.sh` | CREAR | Script de inicio personalizado |
| `package.json` | ✓ Existe | Detectado automáticamente |
| `server.js` | ✓ Correcto | Escucha PORT env var |
| `web.config` | ✓ Existe | Para IIS compatibility |

---

## 🎉 Resultado Esperado

Después de completar todos los pasos:

✅ **App Service en Azure**
✅ **Recibiendo commits de Git automáticamente**
✅ **Oryx detecta Node.js correctamente**
✅ **NPM instala dependencias**
✅ **Vite compila React**
✅ **Server.js inicia el API**
✅ **App disponible en URL pública**
✅ **BD conectada (si está configurada)**

---

## 📞 Recursos

- **Oryx Repo:** https://github.com/Microsoft/Oryx
- **Azure Docs:** https://docs.microsoft.com/azure/app-service/
- **Node.js en Azure:** https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs

---

**Status:** 🟢 **READY FOR PRODUCTION DEPLOYMENT**

**Próximo paso:** Seguir los "Pasos para Hacer Deploy" arriba ↑
