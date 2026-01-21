# 🎯 SOLUCIÓN COMPLETA: Deployment Fallido (Oryx Error)

## Tu Situación
- ✅ Usas **VSCode Azure Extension**
- ❌ Error: `"Couldn't detect a version for the platform 'nodejs'"`
- ❌ Oryx no encuentra `package.json`

---

## 🔴 El Problema (Explicado)

La extensión de VSCode está uploadando archivos, pero **Azure Oryx no puede compilar** porque:

1. `package.json` no está en la raíz del ZIP
2. Falta `dist/` (el frontend compilado)
3. Falta `.env.production` (variables de entorno)

---

## 🟢 La Solución (Rápida - 5 minutos)

### Paso 1: Preparar Localmente

En terminal de VSCode:

```powershell
cd C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo

# Limpiar compilación anterior
Remove-Item dist -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue

# Compilar
npm install
npm run build

# Verificar
if (Test-Path dist) { Write-Host "✓ dist/ creado" } else { Write-Host "✗ ERROR: no dist/" }
```

### Paso 2: Crear .env.production

En VSCode, crea archivo en `cuentame_demo/.env.production`:

```env
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password-Fuerte-2026
REACT_APP_API_URL=https://cuentame-app.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
```

⚠️ **Reemplaza los valores con los tuyos reales**

### Paso 3: Deploy desde VSCode

1. Abre pestaña **Azure** (icono izquierda)
2. Busca: `cuentame-app`
3. Clic derecho → **Deploy to Web App**
4. Selecciona carpeta: `cuentame_demo`
5. **Presiona Enter**

### Paso 4: Espera y Verifica

Verás en terminal:
```
Deploying...
npm install
npm run build
Deployment successful!
```

Luego abre navegador:
```
https://cuentame-app.azurewebsites.net/api/health

Debe retornar:
{"status":"ok"}
```

---

## 📚 Documentación Específica para VSCode

He creado **2 guías** para ti:

### 1. [DEPLOYMENT_VSCODE_EXTENSION.md](DEPLOYMENT_VSCODE_EXTENSION.md)
Guía **COMPLETA** con:
- Paso a paso detallado
- Troubleshooting
- Logs y debugging
- Mejores prácticas

### 2. [DEPLOYMENT_VSCODE_CHECKLIST.md](DEPLOYMENT_VSCODE_CHECKLIST.md)
Checklist **RÁPIDO** con:
- Script para validar todo
- Pasos resumidos
- Soluciones comunes

---

## 🆘 Si Aún Falla

### Opción 1: Verifica Logs en VSCode

En pestaña Azure:
1. Clic derecho en `cuentame-app`
2. Click en **View Stream Logs**
3. Busca el error específico

### Opción 2: Debugging en Azure Portal

1. Azure Portal → cuentame-app
2. Log Stream (menú lateral)
3. Desplega la aplicación y mira los logs

### Opción 3: SSH a la App

1. Azure Portal → cuentame-app → SSH
2. Ejecuta:
   ```bash
   ls -la
   # Debe mostrar: package.json, server.js, dist/
   
   cat package.json
   # Verifica que tiene contenido
   
   npm start
   # Intenta iniciar manualmente
   ```

### Opción 4: Vuelve a PowerShell (Más Confiable)

Si VSCode no funciona, usa PowerShell directo:

```powershell
cd C:\Users\ADMI\Documents\PROYECTOS\CUENTAME\cuentame_demo
npm install
npm run build

cd ..
Compress-Archive -Path ".\cuentame_demo\*" -DestinationPath cuentame_deploy.zip -Force

# Luego sube el ZIP manualmente a Azure Portal
```

Ver: [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md)

---

## ✅ Checklist Final

Antes de hacer deploy, verifica:

- [ ] Estás en carpeta: `cuentame_demo/`
- [ ] `package.json` existe
- [ ] `npm install` ejecutado sin errores
- [ ] `npm run build` ejecutado sin errores
- [ ] `dist/` existe y tiene archivos
- [ ] `.env.production` existe con valores correctos
- [ ] Extension de Azure conectada y muestra App Service
- [ ] Node.js instalado en local (node --version)

---

## 🚀 Resumen Rápido

**Si solo quieres que funcione ahora:**

1. Abre terminal en VSCode
2. Ejecuta:
   ```powershell
   Remove-Item node_modules, dist -Recurse -Force -ErrorAction SilentlyContinue; npm install; npm run build
   ```
3. Abre pestaña Azure
4. Clic derecho en `cuentame-app` → **Deploy to Web App**
5. Espera 2-3 minutos
6. Abre: `https://cuentame-app.azurewebsites.net/api/health`

---

## 📞 Información Necesaria si Aún Falla

Para diagnosticar el problema, comparte:

1. Error exacto que ves en VSCode
2. Output de terminal:
   ```bash
   npm run build
   ```
3. Contenido de `.env.production` (sin contraseñas)
4. Output del Log Stream de Azure

Con eso puedo darte una solución específica.

---

**Status:** ✅ Documentación lista  
**Última actualización:** 19 de Enero de 2026
