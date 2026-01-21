# 🚀 CONFIGURACIÓN PARA AZURE DEPLOYMENT - ORYX FIX

**Problema:** `Error: Couldn't detect a version for the platform 'nodejs' in the repo.`

**Solución:** Archivos de configuración para que Oryx detecte correctamente el proyecto.

---

## 📋 Archivos Creados/Actualizados

### 1. ✅ `.nvmrc` (Nuevo)
```
24
```
**Propósito:** Especifica que el proyecto usa Node.js versión 24

**Ubicación:** Raíz del proyecto

---

### 2. ✅ `.deployment` (Actualizado)
```
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT=true
SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT=true
PROJECT=.
DEPLOYMENT_SOURCE=.
NODEJS_VERSION=24
```
**Propósito:** Instrucciones para Azure App Service

---

### 3. ✅ `.deploymentrc` (Nuevo)
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
**Propósito:** Configuración para Oryx (build engine de Azure)

---

### 4. ✅ `startup.sh` (Nuevo)
Script que Oryx ejecutará durante el build:
1. Verifica Node.js y NPM
2. Instala dependencias
3. Construye la app
4. Inicia el servidor

---

## 🔧 Cómo Configurar en Azure

### **Opción 1: Azure Portal (Recomendado)**

1. Abre **Azure App Service** → Tu app
2. Ve a **Settings** → **Application settings**
3. Agrega estas variables de entorno:
   ```
   NODEJS_VERSION = 24
   SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT = true
   ```
4. Guarda los cambios
5. Redeploy (puede ser manual o por Git)

### **Opción 2: Azure CLI**

```bash
az webapp config appsettings set \
  --resource-group <grupo> \
  --name <nombre-app> \
  --settings NODEJS_VERSION=24 \
  SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT=true
```

### **Opción 3: Deployment Script**

```bash
az webapp deployment source config-zip \
  --resource-group <grupo> \
  --name <nombre-app> \
  --src cuentame_demo.zip
```

---

## ✅ Verificación

Después de hacer deploy, verifica que:

1. ✅ **Build log muestra:**
   ```
   Detecting platforms...
   Found Node version: 24
   ```

2. ✅ **App se inicia sin errores:**
   ```
   npm start
   Server running on port 3000
   ```

3. ✅ **API disponible:**
   ```
   GET https://tu-app.azurewebsites.net/api/messages/inbox
   ```

---

## 📊 Estructura de Oryx Build

```
Oryx Build Process:
  1. Detectar plataforma Node.js
     ✓ Lee .nvmrc
     ✓ Lee .deploymentrc
     ✓ Lee .deployment
  
  2. Instalar Node.js versión 24
  
  3. Ejecutar npm ci (instalación producción)
  
  4. Ejecutar npm run build
  
  5. Ejecutar startup.sh o npm start
```

---

## 🆘 Si Aún Hay Problemas

### **Error: Still can't detect Node version**

Prueba esto en Azure Portal:

1. **Application Settings:**
   ```
   WEBSITE_NODE_DEFAULT_VERSION = 24
   NODEJS_VERSION = 24
   ```

2. **Startup Command:**
   ```
   npm start
   ```

3. **Deploy Again**

### **Error: Dependencies not installed**

```bash
# En deployment script
npm ci --production --legacy-peer-deps
```

### **Error: Port already in use**

```bash
# Asegúrate que server.js usa process.env.PORT
app.listen(process.env.PORT || 3000)
```

---

## 📁 Checklist Pre-Deploy

- [ ] `.nvmrc` existe con versión 24
- [ ] `.deployment` tiene NODEJS_VERSION
- [ ] `.deploymentrc` está bien formado
- [ ] `startup.sh` es ejecutable
- [ ] `package.json` está en raíz
- [ ] `server.js` existe y escucha en PORT env var
- [ ] `web.config` está presente (para IIS)
- [ ] `.gitignore` no ignora archivos críticos

---

## 🎯 Próximos Pasos

1. **Commit los cambios:**
   ```bash
   git add .nvmrc .deployment .deploymentrc startup.sh
   git commit -m "Azure deployment configuration for Oryx"
   git push
   ```

2. **En Azure Portal:**
   - Ve a Deployment Center
   - Selecciona source (GitHub/Local Git)
   - Autoriza y conecta
   - Deploy

3. **Monitorear:**
   - Ver logs en Azure Portal
   - Usar `az webapp log tail`

---

## 📞 Soporte Oryx

Si aún tienes problemas, revisa:
- https://github.com/Microsoft/Oryx
- https://docs.microsoft.com/azure/app-service/

---

**Status:** ✅ Configuración completada para Azure Oryx
