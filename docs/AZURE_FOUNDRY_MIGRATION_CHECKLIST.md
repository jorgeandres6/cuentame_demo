# 🚀 Checklist de Migración a Azure Foundry Agents

Este checklist te guiará paso a paso en la migración de las instrucciones hardcodeadas hacia agentes configurados en Azure Foundry.

---

## 📋 Fase 1: Preparación (15 minutos)

### ✅ Paso 1.1: Revisar Documentación
- [ ] Leer [AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md](AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md) completamente
- [ ] Entender la diferencia entre los dos agentes (Estudiantes vs Adultos)
- [ ] Revisar las instrucciones completas de cada agente

### ✅ Paso 1.2: Acceder a Azure AI Foundry
- [ ] Abrir [Azure AI Foundry Portal](https://ai.azure.com)
- [ ] Iniciar sesión con tu cuenta de Azure
- [ ] Verificar que tienes acceso al proyecto correcto
- [ ] Anotar el Project ID

---

## 🤖 Fase 2: Crear Agentes en Azure Foundry (30 minutos)

### ✅ Paso 2.1: Crear Agente para Estudiantes

1. **Navegación:**
   - [ ] En Azure AI Foundry, ir a tu proyecto
   - [ ] Click en "Agents" en el menú lateral
   - [ ] Click en "+ Create agent" o "New agent"

2. **Configuración Básica:**
   - [ ] **Name**: `gestor-conflictos-estudiantes`
   - [ ] **Description**: `Confidente seguro y parte del sistema de apoyo escolar para estudiantes`

3. **Instrucciones del Sistema:**
   - [ ] Abrir [AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md](AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md)
   - [ ] Copiar las instrucciones completas del **AGENTE 1: Para Estudiantes**
   - [ ] Pegar en el campo "System Instructions" o "Instructions"

4. **Configuración del Modelo:**
   - [ ] **Model**: Seleccionar `gpt-4` o `gpt-4-turbo` (recomendado)
   - [ ] **Temperature**: `0.7` (para respuestas empáticas pero consistentes)
   - [ ] **Max tokens**: `2000` (ajustar según necesidad)

5. **Guardar:**
   - [ ] Click en "Create" o "Save"
   - [ ] **IMPORTANTE**: Copiar el **Agent ID** generado
   - [ ] Pegar el Agent ID en tu archivo de notas temporal

### ✅ Paso 2.2: Crear Agente para Adultos

1. **Navegación:**
   - [ ] Click en "+ Create agent" o "New agent" nuevamente

2. **Configuración Básica:**
   - [ ] **Name**: `asistente-protocolos-adultos`
   - [ ] **Description**: `Experto en protocolos educativos y normativa ecuatoriana para adultos`

3. **Instrucciones del Sistema:**
   - [ ] Abrir [AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md](AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md)
   - [ ] Copiar las instrucciones completas del **AGENTE 2: Para Adultos**
   - [ ] Pegar en el campo "System Instructions" o "Instructions"

4. **Configuración del Modelo:**
   - [ ] **Model**: Mismo modelo que usaste para estudiantes
   - [ ] **Temperature**: `0.6` (más objetivo y formal)
   - [ ] **Max tokens**: `2000`

5. **Guardar:**
   - [ ] Click en "Create" o "Save"
   - [ ] **IMPORTANTE**: Copiar el **Agent ID** generado
   - [ ] Pegar el Agent ID en tu archivo de notas temporal

---

## 🔧 Fase 3: Configurar Variables de Entorno (10 minutos)

### ✅ Paso 3.1: Obtener Credenciales de Azure

- [ ] En Azure AI Foundry, ir a "Settings" o "Keys and Endpoints"
- [ ] Copiar:
  - [ ] **API Key**
  - [ ] **Endpoint URL**
  - [ ] **Project ID** (si no lo anotaste antes)

### ✅ Paso 3.2: Actualizar Archivo .env

1. **Abrir archivo .env:**
   - [ ] Abrir tu archivo `.env` en VS Code
   - [ ] Si no existe, crear uno nuevo

2. **Agregar configuración:**
   - [ ] Copiar el contenido de [.env.azure-foundry-example](.env.azure-foundry-example)
   - [ ] Reemplazar los valores de ejemplo con tus credenciales reales:
   
   ```env
   AZURE_FOUNDRY_API_KEY=<tu-api-key-real>
   AZURE_FOUNDRY_ENDPOINT=<tu-endpoint-real>
   AZURE_FOUNDRY_PROJECT_ID=<tu-project-id-real>
   AZURE_FOUNDRY_STUDENT_AGENT_ID=<agent-id-estudiantes-real>
   AZURE_FOUNDRY_ADULT_AGENT_ID=<agent-id-adultos-real>
   ```

3. **Verificar:**
   - [ ] Confirmar que no hay espacios al inicio o final de los valores
   - [ ] Confirmar que los Agent IDs son correctos
   - [ ] Guardar el archivo

### ✅ Paso 3.3: Seguridad

- [ ] Confirmar que `.env` está en `.gitignore`
- [ ] NO subir el archivo `.env` a Git
- [ ] Considerar usar Azure Key Vault para producción

---

## 💻 Fase 4: Actualizar el Código (20 minutos)

### ✅ Paso 4.1: Verificar Archivos Nuevos

Estos archivos ya fueron creados por mí:
- [x] `services/azureFoundryAgentService.js` - Nuevo servicio
- [x] `AZURE_FOUNDRY_INTEGRATION_EXAMPLE.js` - Ejemplo de integración
- [x] `.env.azure-foundry-example` - Template de variables

### ✅ Paso 4.2: Actualizar server.js

1. **Importar el nuevo servicio:**
   - [ ] Abrir `server.js`
   - [ ] Al inicio del archivo, agregar:
   ```javascript
   const {
     sendMessageToAzureFoundryAgent,
     classifyCaseWithAzureFoundryAgent
   } = require('./services/azureFoundryAgentService');
   ```

2. **Actualizar ruta de chat:**
   - [ ] Buscar la ruta `/api/azure-foundry/chat`
   - [ ] Reemplazar con el código del ejemplo en `AZURE_FOUNDRY_INTEGRATION_EXAMPLE.js` (Paso 2)
   - [ ] Verificar que los parámetros coincidan

3. **Actualizar ruta de clasificación:**
   - [ ] Buscar la ruta `/api/azure-foundry/classify`
   - [ ] Reemplazar con el código del ejemplo en `AZURE_FOUNDRY_INTEGRATION_EXAMPLE.js` (Paso 3)
   - [ ] Verificar que los parámetros coincidan

4. **Agregar health check (opcional):**
   - [ ] Copiar la ruta `/api/azure-foundry/health` del ejemplo
   - [ ] Pegar en `server.js`

### ✅ Paso 4.3: Limpiar Código Legacy (DESPUÉS de probar)

**NO hagas esto hasta confirmar que todo funciona:**
- [ ] ⏳ Comentar (no eliminar) las constantes:
  - `STUDENT_SYSTEM_INSTRUCTION`
  - `ADULT_SYSTEM_INSTRUCTION`
  - `ESCALATION_RULE`
  - `ATTEMPT_SOLUTION_RULE`
- [ ] ⏳ Mantener `OFFICIAL_TYPOLOGIES` (se usa para validación)

---

## 🧪 Fase 5: Pruebas (30 minutos)

### ✅ Paso 5.1: Verificar Configuración

1. **Health Check:**
   - [ ] Iniciar el servidor: `npm start` o `node server.js`
   - [ ] Abrir navegador en: `http://localhost:3000/api/azure-foundry/health`
   - [ ] Verificar que todos los campos muestren `true`
   - [ ] Si algún campo es `false`, revisar las variables de entorno

### ✅ Paso 5.2: Probar Chat con Estudiante

1. **Escenario de prueba:**
   - [ ] Abrir la aplicación frontend
   - [ ] Seleccionar rol "Estudiante"
   - [ ] Iniciar conversación de prueba
   - [ ] Enviar mensaje: _"Hola, tengo un problema con un compañero"_

2. **Verificar respuesta:**
   - [ ] La respuesta debe ser cálida y empática
   - [ ] Debe usar lenguaje apropiado para estudiantes
   - [ ] No debe mencionar que es un bot/IA
   - [ ] Debe pedir más detalles de manera natural

3. **Probar escalamiento:**
   - [ ] Continuar conversación describiendo un conflicto leve
   - [ ] Verificar que el agente intente ayudar primero
   - [ ] Solo debe derivar al DECE si es necesario

### ✅ Paso 5.3: Probar Chat con Adulto

1. **Escenario de prueba:**
   - [ ] Cerrar chat anterior y limpiar
   - [ ] Seleccionar rol "Padre" o "Docente"
   - [ ] Iniciar conversación
   - [ ] Enviar mensaje: _"Necesito reportar un incidente de bullying"_

2. **Verificar respuesta:**
   - [ ] La respuesta debe ser formal e institucional
   - [ ] Debe mencionar protocolos y normativa
   - [ ] Debe usar terminología correcta (DECE, LOEI, etc.)
   - [ ] Debe pedir información específica para el reporte

### ✅ Paso 5.4: Probar Clasificación

1. **Simular conversación completa:**
   - [ ] Iniciar chat como estudiante
   - [ ] Describir un caso de acoso escolar
   - [ ] Mantener conversación de al menos 5 mensajes
   - [ ] Finalizar y enviar reporte

2. **Verificar clasificación:**
   - [ ] Abrir la consola del backend
   - [ ] Verificar que la clasificación se generó
   - [ ] Confirmar que:
     - [ ] `typology` es una de las oficiales
     - [ ] `riskLevel` es apropiado al caso
     - [ ] `summary` describe el caso correctamente
     - [ ] `recommendations` son pertinentes

### ✅ Paso 5.5: Pruebas de Error

1. **Probar sin conexión:**
   - [ ] Desactivar temporalmente una variable de entorno
   - [ ] Reiniciar servidor
   - [ ] Intentar enviar mensaje
   - [ ] Verificar mensaje de error claro al usuario

2. **Probar con Agent ID inválido:**
   - [ ] Cambiar temporalmente un Agent ID a valor inválido
   - [ ] Reiniciar servidor
   - [ ] Verificar manejo de error apropiado

---

## 📊 Fase 6: Monitoreo y Optimización (continuo)

### ✅ Paso 6.1: Configurar Monitoreo

- [ ] En Azure AI Foundry, ir a "Analytics" o "Monitoring"
- [ ] Activar logs de conversaciones
- [ ] Configurar alertas para errores
- [ ] Revisar métricas de uso diario

### ✅ Paso 6.2: Optimización de Instrucciones

**Después de 1 semana de uso:**
- [ ] Revisar conversaciones en Azure Foundry
- [ ] Identificar respuestas que se pueden mejorar
- [ ] Actualizar instrucciones del agente directamente en Azure Foundry
- [ ] NO necesitas redesplegar código - los cambios son inmediatos

### ✅ Paso 6.3: A/B Testing (opcional)

Si quieres experimentar:
- [ ] Crear versiones alternativas de los agentes
- [ ] Asignar diferentes Agent IDs para diferentes usuarios
- [ ] Comparar métricas de satisfacción
- [ ] Implementar la versión ganadora

---

## 🚨 Solución de Problemas

### Error: "Agent not found"
- **Causa**: Agent ID incorrecto
- **Solución**: Verificar Agent IDs en Azure AI Foundry y actualizar `.env`

### Error: "Unauthorized" o 401
- **Causa**: API Key inválida o expirada
- **Solución**: Regenerar API Key en Azure y actualizar `.env`

### Error: "Endpoint not found" o 404
- **Causa**: Endpoint URL incorrecto
- **Solución**: Copiar correctamente el endpoint desde Azure AI Foundry

### Respuestas genéricas o fuera de contexto
- **Causa**: Instrucciones del agente no están completas
- **Solución**: Verificar que copiaste TODAS las instrucciones en Azure Foundry

### El agente no selecciona correctamente (estudiante vs adulto)
- **Causa**: Lógica de selección en `selectAgentId()` incorrecta
- **Solución**: Verificar los roles en `azureFoundryAgentService.js`

---

## ✅ Checklist Final

Antes de considerar la migración completa:

- [ ] Ambos agentes creados y probados en Azure Foundry
- [ ] Variables de entorno configuradas correctamente
- [ ] Código actualizado y funcionando
- [ ] Pruebas con estudiantes completadas exitosamente
- [ ] Pruebas con adultos completadas exitosamente
- [ ] Clasificación de casos funciona correctamente
- [ ] Manejo de errores implementado y probado
- [ ] Health check endpoint responde correctamente
- [ ] Documentación actualizada
- [ ] Equipo capacitado en cómo actualizar instrucciones en Azure Foundry

---

## 📚 Recursos Adicionales

- [Azure AI Foundry Documentation](https://learn.microsoft.com/azure/ai-studio/)
- [Azure AI Agents Guide](https://learn.microsoft.com/azure/ai-studio/how-to/create-agent)
- [AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md](AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md) - Instrucciones completas
- [AZURE_FOUNDRY_INTEGRATION_EXAMPLE.js](AZURE_FOUNDRY_INTEGRATION_EXAMPLE.js) - Ejemplos de código

---

## 🎉 ¡Migración Completada!

Una vez completados todos los checkboxes, tu aplicación estará usando agentes configurados en Azure Foundry. Los beneficios incluyen:

✅ Código más limpio y mantenible  
✅ Actualizaciones sin redespliegue  
✅ Versionamiento de instrucciones  
✅ Mejor separación de responsabilidades  
✅ Capacidad de A/B testing  
✅ Métricas y analytics mejorados  

**¡Felicitaciones por completar la migración! 🚀**
