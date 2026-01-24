# 🚀 Deployment Azure Foundry en Azure Web App

## 📋 Guía de Configuración en Producción

Esta guía te ayudará a configurar Azure Foundry en tu Azure Web App existente.

---

## ✅ Pre-requisitos

- ✓ Aplicación ya desplegada en Azure Web App
- ✓ Credenciales de Azure AI Foundry disponibles
- ✓ Acceso al Azure Portal

---

## 🔧 Configuración Paso a Paso

### 1️⃣ Configurar Variables de Entorno en Azure Web App

#### Acceder a la Configuración:

1. Ve a **Azure Portal**: https://portal.azure.com
2. Busca tu **App Service** (Web App)
3. En el menú izquierdo, ve a **Settings** → **Configuration**
4. Selecciona la pestaña **Application settings**

#### Agregar Variables de Azure Foundry:

Click en **+ New application setting** y agrega cada una:

| Name | Value | Descripción |
|------|-------|-------------|
| `AZURE_FOUNDRY_ENDPOINT` | `https://your-endpoint.azure.com` | Endpoint de tu Azure Foundry |
| `AZURE_FOUNDRY_API_KEY` | `your-api-key-here` | API Key de Azure Foundry |
| `AZURE_FOUNDRY_DEPLOYMENT_NAME` | `your-deployment-name` | Nombre del deployment |
| `AZURE_FOUNDRY_API_VERSION` | `2024-01-01` | Versión de la API |

#### Variables Existentes (Conservar):

Asegúrate de mantener las variables existentes:
- `GEMINI_API_KEY` (para respaldo)
- `DB_SERVER`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (Base de datos)
- `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY` (Blob Storage)

#### Guardar y Reiniciar:

5. Click en **Save** (arriba)
6. Confirma cuando te pregunte
7. Click en **Restart** para aplicar los cambios
8. Espera 1-2 minutos para que reinicie

---

### 2️⃣ Verificar el Deployment

#### Opción A: Desde el Portal

1. En tu Web App, ve a **Monitoring** → **Log stream**
2. Deberías ver:
   ```
   ✅ Azure Foundry Agent configured
   ```

#### Opción B: Desde la Aplicación

1. Accede a tu URL de producción: `https://tu-app.azurewebsites.net`
2. Prueba la funcionalidad de chat
3. Verifica que el agente responda correctamente

#### Opción C: Test Manual con cURL

```bash
# Reemplaza tu-app con el nombre real
curl -X POST https://tu-app.azurewebsites.net/api/azure-foundry/chat \
  -H "Content-Type: application/json" \
  -d '{"history": [], "newMessage": "Hola", "userRole": "student"}'
```

---

### 3️⃣ Monitoreo y Logs

#### Ver Logs en Tiempo Real:

1. Azure Portal → Tu Web App
2. **Monitoring** → **Log stream**
3. Observa:
   - `✅ Azure Foundry Agent configured`
   - Requests a `/api/azure-foundry/chat`
   - Requests a `/api/azure-foundry/classify`

#### Ver Logs Históricos:

1. **Monitoring** → **App Service logs**
2. Enable **Application Logging (Filesystem)**
3. Set Level to **Information**
4. **Save**

#### Métricas Importantes:

1. **Monitoring** → **Metrics**
2. Monitorea:
   - Response Time
   - HTTP Server Errors
   - CPU Percentage
   - Memory Percentage

---

## 🔄 Rollback Plan (Si algo falla)

### Opción 1: Volver a Gemini

Si Azure Foundry presenta problemas, puedes volver a Gemini temporalmente:

#### En el Código (requiere re-deploy):

1. Edita `components/ChatInterface.tsx` línea 6:
   ```typescript
   // Cambiar de Azure Foundry a Gemini
   import { sendMessageToGemini as sendMessageToAI, 
            classifyCaseWithGemini as classifyCaseWithAI } 
   from '../services/geminiService';
   ```

2. Deploy la aplicación
3. Gemini seguirá funcionando porque está intacto

#### Manteniendo Azure Foundry en el backend:

No es necesario hacer cambios, los endpoints de Gemini siguen disponibles:
- `/api/chat` (Gemini)
- `/api/classify` (Gemini)

---

## 🐛 Troubleshooting en Producción

### Error: "Azure Foundry not configured"

**Causa:** Variables de entorno no configuradas o mal escritas

**Solución:**
1. Verifica en **Configuration** → **Application settings**
2. Asegúrate de que los nombres sean exactos (case-sensitive)
3. **Restart** la aplicación

### Error: 401 Unauthorized desde Azure Foundry

**Causa:** API Key incorrecta o sin permisos

**Solución:**
1. Verifica la API Key en Azure AI Foundry Portal
2. Genera una nueva key si es necesario
3. Actualiza en **Application settings**
4. **Restart**

### Error: Timeout / Gateway Timeout

**Causa:** Azure Foundry endpoint no responde o timeout muy corto

**Solución:**
1. Verifica el endpoint en Azure AI Foundry Portal
2. Aumenta el timeout en `server.js` (línea ~274):
   ```javascript
   timeout: 60000  // De 30s a 60s
   ```
3. Re-deploy la aplicación

### Logs no muestran configuración

**Causa:** App no reinició correctamente

**Solución:**
1. **Stop** la aplicación
2. Espera 30 segundos
3. **Start** la aplicación
4. Verifica logs

---

## 📊 Monitoreo de Costos

### Azure Foundry:

1. Ve a **Azure AI Foundry Portal**
2. Ve a tu proyecto → **Usage and billing**
3. Monitorea:
   - Tokens consumidos
   - Requests por minuto
   - Costo estimado

### Alertas Recomendadas:

Configura alertas en Azure Portal:
1. **Cost Management** → **Budgets**
2. Crea presupuesto para Azure Foundry
3. Configura alertas al 50%, 80%, 100%

---

## 🔐 Seguridad en Producción

### ✅ Mejores Prácticas Implementadas:

- ✓ API Keys en variables de entorno (no en código)
- ✓ HTTPS por defecto en Azure Web App
- ✓ Timeout configurado (30s)
- ✓ CORS configurado en server.js

### 🔒 Recomendaciones Adicionales:

1. **Rotar API Keys regularmente** (cada 90 días)
2. **Usar Azure Key Vault** para producción:
   ```bash
   # Configurar Key Vault reference en Application Settings
   @Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/AzureFoundryApiKey)
   ```
3. **Habilitar Application Insights** para monitoreo avanzado
4. **Configurar rate limiting** en Azure API Management (si aplica)

---

## 📈 Optimizaciones para Producción

### 1. Caché de Respuestas

Considera implementar caché para preguntas frecuentes:

```javascript
// En server.js
const responseCache = new Map();

// Antes de llamar Azure Foundry
const cacheKey = `${userRole}:${newMessage}`;
if (responseCache.has(cacheKey)) {
  return responseCache.get(cacheKey);
}

// Después de respuesta exitosa
responseCache.set(cacheKey, response, { ttl: 3600 });
```

### 2. Scale Up/Out

Si hay alta demanda:

1. **Azure Portal** → Tu Web App
2. **Settings** → **Scale up (App Service plan)**
3. Considera plan superior si es necesario

O scale out:

1. **Scale out (App Service plan)**
2. Aumenta instancias según demanda

### 3. CDN para Assets

1. Configura Azure CDN para archivos estáticos
2. Reduce latencia para usuarios

---

## ✅ Checklist de Deployment

### Pre-Deployment:
- [ ] Código testeado localmente
- [ ] Variables de entorno documentadas
- [ ] Credenciales de Azure Foundry obtenidas
- [ ] Plan de rollback definido

### Durante Deployment:
- [ ] Variables agregadas en Application Settings
- [ ] Aplicación reiniciada
- [ ] Logs verificados
- [ ] Endpoints testeados

### Post-Deployment:
- [ ] Chat funcionando correctamente
- [ ] Clasificación de casos operativa
- [ ] Logs sin errores
- [ ] Métricas monitoreadas
- [ ] Alertas configuradas

---

## 🎯 Deployment Checklist Rápido

```bash
# 1. Azure Portal → Tu Web App → Configuration → Application settings
✓ AZURE_FOUNDRY_ENDPOINT
✓ AZURE_FOUNDRY_API_KEY
✓ AZURE_FOUNDRY_DEPLOYMENT_NAME
✓ AZURE_FOUNDRY_API_VERSION

# 2. Save → Restart

# 3. Monitoring → Log stream
✓ Ver "Azure Foundry Agent configured"

# 4. Prueba la app
✓ Chat funciona
✓ Sin errores en logs

# 5. Monitoreo continuo
✓ Metrics
✓ Alerts
✓ Costs
```

---

## 📞 Soporte

**¿Problemas de configuración?**
→ Revisa logs en **Log stream**

**¿Errores de Azure Foundry?**
→ Verifica credenciales en Azure AI Foundry Portal

**¿Performance issues?**
→ Revisa **Metrics** y considera scale up/out

**¿Costos inesperados?**
→ Revisa **Cost Management** y configura presupuestos

---

## 📚 Recursos Adicionales

- [Azure Web App Configuration](https://learn.microsoft.com/azure/app-service/configure-common)
- [Azure AI Foundry Documentation](https://learn.microsoft.com/azure/ai-services/)
- [Application Insights](https://learn.microsoft.com/azure/azure-monitor/app/app-insights-overview)
- [Azure Key Vault](https://learn.microsoft.com/azure/key-vault/)

---

**Última actualización:** 22 de Enero de 2026  
**Para:** Azure Web App Deployment  
**Estado:** ✅ Producción Ready
