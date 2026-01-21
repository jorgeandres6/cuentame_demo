# 🆘 AZURE DEPLOYMENT FIX - Oryx Configuration

## 🔴 Problema Reportado

```
Error: Couldn't detect a version for the platform 'nodejs' in the repo.
```

Oryx (Microsoft's build engine en Azure) no puede detectar que es un proyecto Node.js.

---

## ✅ Solución Implementada

### Archivos Creados:

1. **`.nvmrc`** 
   ```
   24
   ```
   - Especifica Node.js versión 24
   - Estándar de industria (NVM, fnm, etc.)

2. **`.deploymentrc`**
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
   - Configuración explícita para Oryx

3. **`startup.sh`**
   - Script de inicio que verifica y construye la app
   - Ejecutable por Oryx durante el build

### Archivos Actualizados:

4. **`.deployment`** (Mejorado)
   ```
   [config]
   SCM_DO_BUILD_DURING_DEPLOYMENT=true
   SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT=true
   PROJECT=.
   DEPLOYMENT_SOURCE=.
   NODEJS_VERSION=24
   ```

---

## 🎯 Próximos Pasos para Azure

### 1. Commit y Push
```bash
cd c:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo
git add .nvmrc .deploymentrc startup.sh .deployment
git commit -m "Azure Oryx configuration for Node.js 24"
git push
```

### 2. Configurar en Azure Portal

Ve a tu **App Service** → **Settings** → **Configuration** → **Application settings**

Agrega o modifica:
| Clave | Valor |
|-------|-------|
| `NODEJS_VERSION` | `24` |
| `WEBSITE_NODE_DEFAULT_VERSION` | `24` |
| `SCM_COMMAND_TRIGGER_CUSTOM_DEPLOYMENT` | `true` |

### 3. Redeploy

**Opción A: Deployment Center**
- Abre App Service → Deployment Center
- Selecciona Source (GitHub/Local Git)
- Autoriza y conecta
- Click "Sync" o "Deploy"

**Opción B: Azure CLI**
```bash
az webapp deployment source config-zip \
  --resource-group <resource-group> \
  --name <app-name> \
  --src cuentame.zip
```

**Opción C: Git Push**
```bash
git push origin main
# Automáticamente dispara deployment
```

---

## 📊 Verificación

Después del deployment, verifica en **Logs** → **Deployment logs**:

✅ **Debe mostrar:**
```
Detecting platforms...
Found Node.js version: 24
npm version: XX.X.X
Installing dependencies...
Running: npm ci --production
Running: npm run build
Bundled packages...
Application started successfully
Server running on port 8080
```

---

## 🔍 Troubleshooting

### Si aún hay error "Couldn't detect nodejs"

1. **Limpia la cache de deployment:**
   ```bash
   az webapp deployment source config-zip \
     --resource-group <grupo> \
     --name <app> \
     --src cuentame.zip \
     --clean
   ```

2. **Verifica en portal que los archivos existan:**
   - Ve a **SSH** o **Advanced Tools** (Kudu)
   - Navega a `/home/site/repository`
   - Busca `.nvmrc`, `.deploymentrc`, `package.json`

3. **Revisa los logs detallados:**
   ```bash
   az webapp log tail --resource-group <grupo> --name <app>
   ```

### Si el build falla en "npm install"

Agrega a Application settings:
```
npm_config_loglevel = verbose
NPM_CONFIG_PRODUCTION = true
```

---

## 📋 Checklist Final

- [x] `.nvmrc` creado con versión 24
- [x] `.deploymentrc` creado para Oryx
- [x] `startup.sh` creado como script de inicio
- [x] `.deployment` actualizado
- [x] `package.json` está en raíz
- [x] `server.js` escucha en `process.env.PORT`
- [x] `web.config` presente para IIS
- [ ] Archivos commiteados a Git
- [ ] Azure App Service configurado con variables
- [ ] Deployment realizado exitosamente

---

## 🚀 Resultado Esperado

Después de seguir estos pasos:

✅ Oryx detectará Node.js 24  
✅ NPM instalará dependencias  
✅ Vite compilará React  
✅ Server.js iniciará  
✅ API disponible en `https://tu-app.azurewebsites.net`  

---

**Status:** ✅ Configuración completada y lista para deploy
