# 🎯 ÍNDICE DE DOCUMENTACIÓN - Azure Foundry Integration

## 🚀 Inicio Rápido

**👉 EMPIEZA AQUÍ:** [AZURE_FOUNDRY_START.md](AZURE_FOUNDRY_START.md)

Esta es tu guía de inicio rápido para poner en marcha Azure Foundry en 3 pasos.

---

## 📚 Documentación Completa

### Para Comenzar

1. **[AZURE_FOUNDRY_START.md](AZURE_FOUNDRY_START.md)** 🌟 INICIO RÁPIDO
   - Configuración en 3 pasos
   - Comandos básicos
   - Pruebas rápidas

2. **[RESUMEN_IMPLEMENTACION.md](RESUMEN_IMPLEMENTACION.md)** 📊 RESUMEN VISUAL
   - Estado del proyecto
   - Arquitectura dual (Azure Foundry + Gemini)
   - Checklist completo

### Configuración Detallada

3. **[AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md)** ⚙️ CONFIGURACIÓN
   - Variables de entorno
   - Setup de Azure Foundry
   - Formato de requests/responses
   - Troubleshooting

4. **[AZURE_WEB_APP_DEPLOYMENT.md](AZURE_WEB_APP_DEPLOYMENT.md)** ☁️ AZURE WEB APP
   - Configuración en Azure Portal
   - Application Settings
   - Deployment en producción
   - Monitoreo y logs
   - Rollback plan

5. **[MIGRACION_AZURE_FOUNDRY.md](MIGRACION_AZURE_FOUNDRY.md)** 🔄 MIGRACIÓN
   - Guía paso a paso
   - Cambios realizados
   - Cómo cambiar entre proveedores
   - Checklist de implementación

### Referencia Técnica

6. **[IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md](IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md)** 📖 COMPLETO
   - Documentación técnica completa
   - Todos los cambios detallados
   - Estado de archivos
   - Verificaciones realizadas
   - Próximos pasos

7. **[server-azure-foundry-example.js](server-azure-foundry-example.js)** 💻 CÓDIGO BACKEND
   - Implementación de referencia
   - Helper functions
   - Endpoints comentados

---

## 🗺️ Mapa de Archivos

### Frontend

```
services/
  ├── azureFoundryService.ts     ← Servicio Azure Foundry [NUEVO]
  ├── geminiService.ts           ← Servicio Gemini [INTACTO]
  └── storageService.ts          [Sin cambios]

components/
  └── ChatInterface.tsx          ← Usa Azure Foundry [MODIFICADO]
```

### Backend

```
server.js                        ← Endpoints Azure Foundry [MODIFICADO]
  ├── POST /api/azure-foundry/chat
  ├── POST /api/azure-foundry/classify
  ├── POST /api/chat             [Gemini - Preservado]
  └── POST /api/classify         [Gemini - Preservado]
```

### Configuración

```
.env                             ← Variables de entorno [NUEVO]
.env.example                     ← Plantilla [ACTUALIZADO]
package.json                     ← axios agregado [MODIFICADO]
```

### Testing

```
test-azure-foundry.js            ← Script de pruebas [NUEVO]
```

---

## 📋 Guía Rápida por Rol

### 👨‍💻 Desarrollador Frontend

1. Lee: [AZURE_FOUNDRY_START.md](AZURE_FOUNDRY_START.md)
2. Revisa: [services/azureFoundryService.ts](services/azureFoundryService.ts)
3. Para cambiar proveedor: [MIGRACION_AZURE_FOUNDRY.md](MIGRACION_AZURE_FOUNDRY.md#cambiar-entre-gemini-y-azure-foundry)

### 👨‍💻 Desarrollador Backend

1. Lee: [AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md)
2. Revisa: [server-azure-foundry-example.js](server-azure-foundry-example.js)
3. Implementado en: [server.js](server.js) líneas 254-404

### 🎯 DevOps / Configuración

1. Lee: [AZURE_WEB_APP_DEPLOYMENT.md](AZURE_WEB_APP_DEPLOYMENT.md)
2. Configura: Azure Portal → Application Settings
3. Prueba: Verifica logs en Log stream
4. Monitorea: Métricas y alertas

### 📊 Project Manager

1. Lee: [RESUMEN_IMPLEMENTACION.md](RESUMEN_IMPLEMENTACION.md)
2. Estado: [IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md](IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md)

---

## ✅ Estado Actual

```
✅ Backend implementado
✅ Frontend actualizado
✅ Gemini preservado
✅ Sin errores
✅ Dependencias instaladas
⚠️  Pendiente: Configurar credenciales en .env
```

---

## 🎯 Próximos Pasos

1. **Configurar credenciales:**
   ```env
   # Edita .env
   AZURE_FOUNDRY_ENDPOINT=https://tu-endpoint.azure.com
   AZURE_FOUNDRY_API_KEY=tu-api-key
   AZURE_FOUNDRY_DEPLOYMENT_NAME=tu-deployment
   ```

2. **Iniciar aplicación:**
   ```bash
   npm run dev:server
   npm run dev  # En otra terminal
   ```

3. **Probar:**
   ```bash
   node test-azure-foundry.js
   ```

---

## 🆘 ¿Problemas?

| Problema | Documento |
|----------|-----------|
| No sé por dónde empezar | [AZURE_FOUNDRY_START.md](AZURE_FOUNDRY_START.md) |
| Configurar en Azure Web App | [AZURE_WEB_APP_DEPLOYMENT.md](AZURE_WEB_APP_DEPLOYMENT.md) |
| Errores de configuración | [AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md) - Sección Troubleshooting |
| Quiero volver a Gemini | [MIGRACION_AZURE_FOUNDRY.md](MIGRACION_AZURE_FOUNDRY.md#cambiar-entre-gemini-y-azure-foundry) |
| ¿Qué cambió exactamente? | [IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md](IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md) |
| Entender la arquitectura | [RESUMEN_IMPLEMENTACION.md](RESUMEN_IMPLEMENTACION.md) |

---

## 🔍 Búsqueda Rápida

**¿Cómo configuro Azure Foundry?**
→ [AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md#configuration-steps)

**¿Cómo pruebo la integración?**
→ [AZURE_FOUNDRY_START.md](AZURE_FOUNDRY_START.md#-probar-la-integración)

**¿Cómo cambio entre Gemini y Azure Foundry?**
→ [MIGRACION_AZURE_FOUNDRY.md](MIGRACION_AZURE_FOUNDRY.md#cambiar-entre-gemini-y-azure-foundry)

**¿Dónde están los endpoints?**
→ [server.js](server.js) líneas 288-404

**¿Cómo funciona el servicio frontend?**
→ [services/azureFoundryService.ts](services/azureFoundryService.ts)

**¿Gemini sigue disponible?**
→ Sí, [services/geminiService.ts](services/geminiService.ts) está intacto

---

## 📞 Recursos

- **Azure AI Foundry Portal:** https://ai.azure.com
- **Documentación Azure OpenAI:** https://learn.microsoft.com/azure/ai-services/openai/
- **Repositorio del proyecto:** [Tu repo]

---

**Última actualización:** 22 de Enero de 2026  
**Versión:** 1.0.0  
**Estado:** ✅ Implementación Completa
