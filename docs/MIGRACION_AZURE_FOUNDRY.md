# Guía Rápida: Migración de Gemini a Azure Foundry

## ✅ Cambios Realizados

### Archivos Conservados (Sin Modificar)
- ✓ `services/geminiService.ts` - **Intacto para uso futuro**
- ✓ Toda la configuración y lógica de Gemini permanece disponible

### Archivos Nuevos Creados
1. ✓ `services/azureFoundryService.ts` - Servicio de Azure Foundry
2. ✓ `server-azure-foundry-example.js` - Implementación de backend
3. ✓ `AZURE_FOUNDRY_CONFIG.md` - Documentación completa
4. ✓ `.env.example` - Actualizado con variables de Azure Foundry

### Archivos Modificados
1. ✓ `components/ChatInterface.tsx` - Ahora usa Azure Foundry
   - Los imports de Gemini están comentados
   - Usa `sendMessageToAI` y `classifyCaseWithAI` (Azure Foundry)

## 🚀 Pasos para Activar Azure Foundry

### Paso 1: Configurar Variables de Entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita .env y agrega tus credenciales de Azure Foundry:
AZURE_FOUNDRY_ENDPOINT=https://tu-endpoint.azure.com
AZURE_FOUNDRY_API_KEY=tu-api-key
AZURE_FOUNDRY_DEPLOYMENT_NAME=tu-deployment
AZURE_FOUNDRY_API_VERSION=2024-01-01
AI_SERVICE_PROVIDER=azureFoundry
```

### Paso 2: Instalar Dependencias de Backend
```bash
npm install axios
# O si usas el SDK oficial:
# npm install @azure/openai
```

### Paso 3: Integrar Backend
Abre tu `server.js` y agrega:

```javascript
// Importar el módulo de Azure Foundry
const { 
  handleAzureFoundryChat, 
  handleAzureFoundryClassification 
} = require('./server-azure-foundry-example');

// Agregar las rutas
app.post('/api/azure-foundry/chat', handleAzureFoundryChat);
app.post('/api/azure-foundry/classify', handleAzureFoundryClassification);
```

### Paso 4: Probar la Integración
```bash
# Iniciar el servidor
npm run dev

# En otra terminal, probar el endpoint de chat:
curl -X POST http://localhost:5000/api/azure-foundry/chat \
  -H "Content-Type: application/json" \
  -d '{"history": [], "newMessage": "Hola", "userRole": "student"}'
```

## 🔄 Cambiar Entre Gemini y Azure Foundry

### Opción A: Variables de Entorno (Recomendado para producción)
```env
# En .env:
AI_SERVICE_PROVIDER=azureFoundry  # o 'gemini'
```

Luego necesitarías crear una capa de abstracción que lea esta variable.

### Opción B: Cambio Manual en el Código

**Para volver a Gemini:**
```typescript
// En components/ChatInterface.tsx línea 5-6:
import { sendMessageToGemini as sendMessageToAI, classifyCaseWithGemini as classifyCaseWithAI } from '../services/geminiService';
// import { sendMessageToAzureFoundry as sendMessageToAI, classifyCaseWithAzureFoundry as classifyCaseWithAI } from '../services/azureFoundryService';
```

**Para usar Azure Foundry (actual):**
```typescript
// En components/ChatInterface.tsx línea 5-6:
// import { sendMessageToGemini as sendMessageToAI, classifyCaseWithGemini as classifyCaseWithAI } from '../services/geminiService';
import { sendMessageToAzureFoundry as sendMessageToAI, classifyCaseWithAzureFoundry as classifyCaseWithAI } from '../services/azureFoundryService';
```

## 📋 Checklist de Implementación

- [ ] Variables de entorno configuradas en `.env`
- [ ] Backend actualizado con endpoints de Azure Foundry
- [ ] Dependencias instaladas (`axios` o `@azure/openai`)
- [ ] Credenciales de Azure Foundry obtenidas desde el portal
- [ ] Pruebas de endpoints realizadas
- [ ] Frontend conectado y funcionando
- [ ] Logs de errores monitoreados

## 🔍 Verificación

### 1. Verificar que Gemini sigue disponible
```bash
# El archivo debe existir sin cambios
ls -la services/geminiService.ts
```

### 2. Verificar que Azure Foundry está activo
```typescript
// En ChatInterface.tsx debe estar importando:
import { sendMessageToAzureFoundry as sendMessageToAI, ... } from '../services/azureFoundryService';
```

### 3. Verificar endpoints del backend
```bash
# Debe responder 404 si no está implementado, o 200/500 si está activo
curl -I http://localhost:5000/api/azure-foundry/chat
```

## 🐛 Troubleshooting

### Error: "Cannot find module '@azure/openai'"
```bash
npm install @azure/openai
# O usa axios (ya incluido en el ejemplo)
```

### Error: 401 Unauthorized
- Verifica que `AZURE_FOUNDRY_API_KEY` esté correcta
- Verifica que la API key tenga permisos suficientes

### Error: 404 Endpoint not found
- Asegúrate de haber agregado las rutas en `server.js`
- Verifica que el servidor esté corriendo

### Error: Timeout
- Verifica conectividad a Azure
- Verifica que el endpoint sea el correcto
- Considera aumentar el timeout en el cliente

## 📚 Documentación Adicional

- **Configuración completa**: Ver `AZURE_FOUNDRY_CONFIG.md`
- **Implementación backend**: Ver `server-azure-foundry-example.js`
- **Servicio frontend**: Ver `services/azureFoundryService.ts`

## 🎯 Próximos Pasos

1. **Pruebas de integración**: Probar casos reales con estudiantes y adultos
2. **Monitoreo**: Configurar logs y métricas en Azure
3. **Optimización**: Ajustar parámetros de temperatura y max_tokens
4. **Caché**: Implementar caché para respuestas frecuentes
5. **Rate limiting**: Implementar límites de tasa en el backend

## 💡 Recomendaciones

- **Staging primero**: Prueba en ambiente de desarrollo antes de producción
- **Monitoring**: Configura alertas en Azure para errores y latencia
- **Fallback**: Considera mantener Gemini como respaldo en caso de fallas de Azure
- **Costos**: Monitorea el uso y costos en el portal de Azure
- **Seguridad**: Nunca expongas las API keys, usa variables de entorno

---

**Nota**: Todos los archivos de Gemini permanecen intactos y funcionales. Puedes volver a Gemini en cualquier momento simplemente cambiando los imports en `ChatInterface.tsx`.
