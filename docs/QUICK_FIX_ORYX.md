# 📖 REFERENCIA RÁPIDA: Solución del Error Oryx

## Error Que Recibiste
```
Error: Couldn't detect a version for the platform 'nodejs' in the repo.
```

## Causa
Azure no encontró `package.json` al hacer deploy

## Solución en 3 Pasos

### ✅ Paso 1: Compilar Localmente
```bash
npm install
npm run build
```

### ✅ Paso 2: Crear .env.production
Archivo en `cuentame_demo/.env.production`:
```
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password
REACT_APP_API_URL=https://cuentame-app.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
```

### ✅ Paso 3: Deploy con VSCode Extension
1. Pestaña Azure
2. Clic derecho en `cuentame-app`
3. Deploy to Web App
4. Selecciona: `cuentame_demo/`
5. Espera 2-3 minutos

---

## Verificar que Funciona
```
https://cuentame-app.azurewebsites.net/api/health
```

---

## 📚 Guías Completas (Según tu Situación)

| Necesitas | Lee |
|-----------|-----|
| **Paso a paso (VSCode)** | [DEPLOYMENT_VSCODE_EXTENSION.md](DEPLOYMENT_VSCODE_EXTENSION.md) |
| **Checklist rápido** | [DEPLOYMENT_VSCODE_CHECKLIST.md](DEPLOYMENT_VSCODE_CHECKLIST.md) |
| **Troubleshooting completo** | [SOLUCION_DEPLOYMENT_VSCODE.md](SOLUCION_DEPLOYMENT_VSCODE.md) |
| **Método alternativo (PowerShell)** | [DEPLOYMENT_RAPIDO.md](DEPLOYMENT_RAPIDO.md) |

---

## 🆘 Problemas Comunes

| Problema | Solución |
|----------|----------|
| "package.json not found" | Compila: `npm run build` |
| "Build failed" | Ejecuta: `npm install` primero |
| Extension no detecta App Service | Haz login en pestaña Azure |
| Error: "Cannot find module" | Borra `node_modules` y `npm install` |

---

## ⏱️ Tiempo Estimado
- Compilar: 1-2 minutos
- Deploy: 2-3 minutos
- Total: 5 minutos

---

**Necesitas más ayuda?** Ve a [SOLUCION_DEPLOYMENT_VSCODE.md](SOLUCION_DEPLOYMENT_VSCODE.md)
