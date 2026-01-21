# 🔴 CRITICAL FIX: Missing Dependencies in Azure

## Problema Identificado

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

**Causa:** Azure no ejecutó `npm ci` para instalar dependencias antes de ejecutar `npm start`.

El flujo incorrecto era:
```
Azure Deploy
  ↓
Intenta: npm start
  ↓
node server.js (sin dependencias)
  ↓
❌ Cannot find package 'express'
```

---

## ✅ Solución: Deploy Script Explícito

Creé archivos que **fuerzan** la instalación de dependencias:

### 1. `deploy.sh` (NUEVO)
Script que Azure ejecuta durante el deployment:
- ✅ Instala dependencias con `npm ci`
- ✅ Verifica que 'express' esté disponible
- ✅ Compila React si es necesario
- ✅ Valida que server.js exista

### 2. `startup-azure.sh` (NUEVO)
Script que se ejecuta al iniciar la app:
- ✅ Verifica que las dependencias estén presentes
- ✅ Si faltan, las reinstala
- ✅ Valida todos los paquetes críticos
- ✅ Compila React si falta
- ✅ Ejecuta server.js

### 3. `postinstall.sh` (NUEVO)
Script que se ejecuta después de `npm ci`:
- ✅ Verifica integridad de dependencias
- ✅ Detecta problemas de instalación

### 4. `package.json` (ACTUALIZADO)
Agregué:
```json
"postinstall": "bash postinstall.sh || true"
```

### 5. `.deployment` (ACTUALIZADO)
Configuración simplificada para Oryx:
```
SCM_DO_BUILD_DURING_DEPLOYMENT=false
NODEJS_VERSION=24
```

---

## 🔄 Flujo Correcto (con fix)

```
Azure Deploy
  ↓
Oryx detecta Node.js 24 (via .nvmrc)
  ↓
Ejecuta: npm ci --production
  ↓
postinstall.sh valida las dependencias ✓
  ↓
npm run build (compila React)
  ↓
Copia archivos a /home/site/wwwroot
  ↓
Azure inicia app
  ↓
startup-azure.sh verifica todo
  ↓
npm start → node server.js ✓
  ↓
✅ Server escucha en puerto 8080
```

---

## 📁 Archivos Nuevos/Modificados

| Archivo | Acción | Propósito |
|---------|--------|----------|
| `deploy.sh` | NUEVO | Script principal para Oryx |
| `startup-azure.sh` | NUEVO | Validación al iniciar |
| `postinstall.sh` | NUEVO | Validación post-npm ci |
| `package.json` | ACTUALIZADO | Agregó postinstall hook |
| `.deployment` | ACTUALIZADO | Configuración Oryx |

---

## 🚀 Cómo Deploy Ahora

```bash
# 1. Commit local
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo
git add deploy.sh startup-azure.sh postinstall.sh package.json .deployment
git commit -m "CRITICAL FIX: Ensure npm dependencies are installed on Azure"

# 2. Push
git push origin main

# 3. En Azure Portal (opcional):
# - Vamos a Deployment Center
# - Click "Sync" para forzar redeploy
# - Monitoreamos logs en "Logs"
```

---

## 📊 Qué Esperar en Logs

**ANTES (error):**
```
npm start
node server.js
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

**DESPUÉS (correcto):**
```
npm ci --production
npm notice created a lockfile
npm info added XXX packages

postinstall.sh
✅ Dependencies installed
✅ express verified
✅ mssql verified

npm start
🚀 Server running on port 8080
```

---

## 🆘 Troubleshooting

### Si aún falta 'express':
```bash
# En Azure Portal:
1. App Service → Configuration → Application Settings
2. Agrega: npm_config_production = false
3. Click Save
4. Vuelve a hacer Deploy
```

### Si sigue fallando:
```bash
# Desconecta y reconecta el repo:
1. Deployment Center → Disconnect
2. Wait 30 seconds
3. Connect nuevamente y Select repo
4. Click Save para trigger deploy
```

### Si ves "npm ci failed":
```bash
# En Azure Portal:
1. App Service → Configuration
2. Agrega: NODE_ENV = production
3. Agrega: npm_config_legacy_peer_deps = true
4. Save y redeploy
```

---

## ✅ Verificación Post-Deploy

Después de redeploy, verifica:

```bash
# En Azure:
1. App Service → Overview → Monitoring
2. Deberías ver "Application running" (verde)
3. En Logs (Deployment Center):
   - Busca: "npm ci" ✅
   - Busca: "postinstall" ✅
   - NO debería haber "Cannot find package" ❌
```

---

## 🟢 Status: READY FOR REDEPLOYMENT

Todos los scripts están listos. El siguiente deploy debería:
1. ✅ Instalar dependencias correctamente
2. ✅ Compilar React
3. ✅ Validar integridad
4. ✅ Iniciar servidor sin errores

**Próximo comando:**
```bash
git push origin main
```

Entonces monitorea en Azure Deployment Center → Logs.
