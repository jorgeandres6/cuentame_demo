# 🚀 Azure Foundry - Quick Start

## ✅ Implementación Completada

La integración de Azure AI Foundry está **100% completada** y lista para usar. Gemini permanece intacto como respaldo.

---

## 📋 Configuración en 3 Pasos

### 1️⃣ Configurar Credenciales

#### 🔧 Para Desarrollo Local:

Edita el archivo `.env` con tus credenciales de Azure Foundry:

```env
AZURE_FOUNDRY_ENDPOINT=https://tu-endpoint.azure.com
AZURE_FOUNDRY_API_KEY=tu-api-key-aqui
AZURE_FOUNDRY_DEPLOYMENT_NAME=tu-deployment
```

#### ☁️ Para Azure Web App (PRODUCCIÓN):

1. Ve al Azure Portal: https://portal.azure.com
2. Navega a tu Web App
3. Ve a **Settings** → **Configuration** → **Application settings**
4. Agrega las siguientes variables:
   - `AZURE_FOUNDRY_ENDPOINT`: https://tu-endpoint.azure.com
   - `AZURE_FOUNDRY_API_KEY`: tu-api-key
   - `AZURE_FOUNDRY_DEPLOYMENT_NAME`: tu-deployment
   - `AZURE_FOUNDRY_API_VERSION`: 2024-01-01
5. Click **Save** y luego **Restart** la Web App

### 2️⃣ Iniciar Servidor (Local)

```bash
npm run dev:server
```

### 3️⃣ Iniciar Frontend (en otra terminal)

```bash
npm run dev
```

---

## 🧪 Probar la Integración

```bash
# Prueba automatizada
node test-azure-foundry.js
```

O manualmente:

```bash
# Test chat
curl -X POST http://localhost:3000/api/azure-foundry/chat \
  -H "Content-Type: application/json" \
  -d "{\"history\": [], \"newMessage\": \"Hola\", \"userRole\": \"student\"}"
```

---

## 📚 Documentación

- **[IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md](IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md)** ← **EMPIEZA AQUÍ** 
- [AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md) - Configuración detallada
- [MIGRACION_AZURE_FOUNDRY.md](MIGRACION_AZURE_FOUNDRY.md) - Guía de migración

---

## 🔄 Cambiar de Proveedor

### Usar Azure Foundry (ACTUAL):
```typescript
// ChatInterface.tsx línea 6
import { sendMessageToAzureFoundry as sendMessageToAI, ... }
```

### Volver a Gemini:
```typescript
// ChatInterface.tsx línea 5 (descomentar)
import { sendMessageToGemini as sendMessageToAI, ... }
```

---

## ✨ Archivos Creados/Modificados

### ✨ Nuevos:
- `services/azureFoundryService.ts` - Servicio frontend
- `test-azure-foundry.js` - Script de pruebas
- `.env` - Configuración
- Documentación completa

### 📝 Modificados:
- `server.js` - Endpoints Azure Foundry agregados
- `components/ChatInterface.tsx` - Usa Azure Foundry
- `package.json` - Axios agregado

### 🔒 Intactos:
- `services/geminiService.ts` - **SIN CAMBIOS**

---

## ⚡ Estado

```
✅ Backend implementado
✅ Frontend actualizado  
✅ Dependencias instaladas
✅ Sin errores de compilación
✅ Documentación completa
⚠️  Pendiente: Configurar credenciales en .env
```

---

## 🆘 Ayuda Rápida

**¿Dónde obtengo las credenciales?**
→ Azure AI Foundry Portal → Tu Proyecto → Settings

**¿Cómo pruebo sin configurar Azure?**
→ Cambia a Gemini en `ChatInterface.tsx` (ver arriba)

**¿Problemas?**
→ Revisa [IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md](IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md) sección Troubleshooting

---

**Listo para producción** ✨  
Solo falta configurar tus credenciales de Azure en `.env`
