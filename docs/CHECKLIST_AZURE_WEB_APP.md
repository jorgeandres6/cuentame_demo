# ✅ Checklist Rápido: Azure Foundry en Azure Web App

## 🎯 Configuración en 5 Minutos

### Paso 1: Azure Portal (2 min)

1. [ ] Ir a https://portal.azure.com
2. [ ] Buscar tu Web App (App Service)
3. [ ] Ir a **Settings** → **Configuration**
4. [ ] Seleccionar pestaña **Application settings**

### Paso 2: Agregar Variables (2 min)

Click **+ New application setting** para cada una:

- [ ] **Name:** `AZURE_FOUNDRY_ENDPOINT`  
      **Value:** `https://tu-endpoint.azure.com`

- [ ] **Name:** `AZURE_FOUNDRY_API_KEY`  
      **Value:** `tu-api-key`

- [ ] **Name:** `AZURE_FOUNDRY_DEPLOYMENT_NAME`  
      **Value:** `tu-deployment-name`

- [ ] **Name:** `AZURE_FOUNDRY_API_VERSION`  
      **Value:** `2024-01-01`

### Paso 3: Guardar y Reiniciar (1 min)

- [ ] Click **Save** (arriba)
- [ ] Confirmar cuando pregunte
- [ ] Click **Restart**
- [ ] Esperar 1-2 minutos

---

## 🔍 Verificación Rápida

### En Azure Portal:

- [ ] Ir a **Monitoring** → **Log stream**
- [ ] Verificar que aparezca: `✅ Azure Foundry Agent configured`

### En la App:

- [ ] Abrir: `https://tu-app.azurewebsites.net`
- [ ] Probar el chat
- [ ] Verificar que el agente responde

### Con cURL (Opcional):

```bash
curl -X POST https://tu-app.azurewebsites.net/api/azure-foundry/chat \
  -H "Content-Type: application/json" \
  -d '{"history": [], "newMessage": "Hola", "userRole": "student"}'
```

- [ ] Respuesta exitosa (status 200)
- [ ] Mensaje del agente en la respuesta

---

## 🚨 Si Algo Sale Mal

### Error: "Azure Foundry not configured"

- [ ] Verificar que las 4 variables estén en Application Settings
- [ ] Verificar nombres exactos (case-sensitive)
- [ ] Restart la aplicación
- [ ] Esperar 2 minutos y revisar logs

### Error: 401 Unauthorized

- [ ] Ir a Azure AI Foundry Portal
- [ ] Verificar/copiar API Key
- [ ] Actualizar en Application Settings
- [ ] Restart

### No aparece en logs

- [ ] Stop la aplicación
- [ ] Esperar 30 segundos
- [ ] Start la aplicación
- [ ] Revisar Log stream nuevamente

---

## 📊 Monitoreo Post-Deploy

### Primeras 24 horas:

- [ ] Revisar **Metrics** → Response Time
- [ ] Revisar **Metrics** → HTTP Server Errors
- [ ] Verificar logs sin errores críticos

### Primera semana:

- [ ] Configurar **Alerts** para errores
- [ ] Monitorear costos en Azure AI Foundry
- [ ] Revisar feedback de usuarios

---

## 🔄 Plan de Rollback (Si es necesario)

### Opción 1: Remover variables

- [ ] Configuration → Application settings
- [ ] Eliminar variables de Azure Foundry
- [ ] Save → Restart
- [ ] La app volverá a Gemini automáticamente (endpoints intactos)

### Opción 2: Cambiar código (requiere deploy)

- [ ] Editar `ChatInterface.tsx` línea 6
- [ ] Cambiar import a `geminiService`
- [ ] Deploy código
- [ ] Restart

---

## ✅ Checklist Completo

**Pre-Deploy:**
- [x] Código implementado
- [x] Documentación leída
- [ ] Credenciales de Azure Foundry obtenidas

**Deploy:**
- [ ] Variables agregadas en Azure Portal
- [ ] Aplicación reiniciada
- [ ] Logs verificados
- [ ] Chat testeado

**Post-Deploy:**
- [ ] Funcionamiento verificado
- [ ] Alertas configuradas
- [ ] Costos monitoreados
- [ ] Equipo informado

---

## 📱 URLs Importantes

- **Azure Portal:** https://portal.azure.com
- **Azure AI Foundry:** https://ai.azure.com
- **Tu Web App:** `https://tu-app.azurewebsites.net`
- **Log Stream:** Portal → Tu Web App → Monitoring → Log stream

---

## 📞 Referencias Rápidas

- **Guía completa:** [AZURE_WEB_APP_DEPLOYMENT.md](AZURE_WEB_APP_DEPLOYMENT.md)
- **Troubleshooting:** [AZURE_FOUNDRY_CONFIG.md](AZURE_FOUNDRY_CONFIG.md)
- **Índice:** [INDICE_AZURE_FOUNDRY.md](INDICE_AZURE_FOUNDRY.md)

---

**Tiempo estimado total: 5-10 minutos** ⏱️  
**Última actualización:** 22 de Enero de 2026
