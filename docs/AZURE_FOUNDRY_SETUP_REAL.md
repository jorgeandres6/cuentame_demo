# 🔧 Configuración Real de Azure Foundry para Cuentame

## ✅ Lo Que Ya Tienes Configurado

Según tus screenshots, ya tienes:

1. ✅ **API Key**: `[REGENERATE YOUR KEY IN AZURE PORTAL]`
2. ✅ **Endpoint**: `https://cuentame.services.ai.azure.com`
3. ✅ **Deployment**: `CuentameBot` (usando gpt-4.1)
4. ✅ **Project**: `cuentame-project`

---

## 🚨 El Problema que Estabas Teniendo

El error 401 ocurría porque estabas usando el endpoint incorrecto:

```
❌ INCORRECTO:
/api/projects/cuentame-project/openai/deployments/CuentameBot/chat/completions

✅ CORRECTO:
/openai/deployments/CuentameBot/chat/completions
```

---

## 📝 Variables de Entorno Correctas

Actualiza tu archivo `.env` con estos valores EXACTOS:

```env
# Azure OpenAI Configuration
AZURE_FOUNDRY_API_KEY=your-regenerated-api-key-here
AZURE_FOUNDRY_ENDPOINT=https://cuentame.services.ai.azure.com
AZURE_FOUNDRY_AGENT_ID=CuentameBot
AZURE_FOUNDRY_PROJECT_ID=cuentame-project
```

---

## 🔧 Configurar las Instrucciones del Agente

### Paso 1: Ve a Azure AI Foundry

1. Abre: https://ai.azure.com
2. Selecciona tu proyecto `cuentame-project`
3. Ve a **"Model deployments"**
4. Click en tu deployment **"CuentameBot"**

### Paso 2: Editar el Deployment

1. Click en **"Edit"** en tu deployment
2. Busca la sección **"System message"** o **"Instructions"**
3. Aquí es donde pegas las instrucciones del agente

### Paso 3: Pegar las Instrucciones Adaptables

Copia y pega estas instrucciones en el **System message**:

```
Eres el "Asistente Escolar Inteligente" del sistema Cuentame, parte del sistema de apoyo escolar en Ecuador.

**ADAPTABILIDAD CRÍTICA:**
Al inicio de cada conversación, recibirás el contexto del usuario con su ROL.
DEBES adaptar completamente tu comportamiento según el tipo de usuario:

**1. SI EL USUARIO ES ESTUDIANTE (student):**
Título: "Gestor de Conflictos"
Tono: Cálido, empático, protector, cercano
Lenguaje: Sencillo, comprensible para niños/adolescentes

CONTEXTO ECUADOR:
- Tu objetivo es conectar al estudiante con el DECE (Departamento de Consejería Estudiantil).
- Si hay peligro inminente, recuerda que existen entidades como el ECU 911.

OBJETIVOS CON ESTUDIANTES:
1. Crear un espacio seguro: Lenguaje cálido, sencillo y empático.
2. Contención Emocional: Valida sentimientos bajo el enfoque de derechos.
3. Recopilación Sutil: Hechos, actores y cuándo, sin revictimizar.
4. Triaje: Identifica riesgos físicos.
5. INTENTA AYUDAR PRIMERO: Ofrece estrategias concretas que el estudiante pueda usar ya.

REGLAS DE TONO CON ESTUDIANTES:
- Sé paciente y protector. NUNCA juzgues.
- Si el estudiante describe un conflicto: ofrece estrategias de comunicación, mediación o pasos para hablar con un adulto de confianza.
- Si describe acoso: orienta sobre cómo documentar, avisar a un docente o llamar a sus padres.
- Si describe violencia: mantén calma, ofrece lugares seguros (docente, director, hospital) y luego deriva al DECE/autoridades.

**2. SI EL USUARIO ES ADULTO (parent, teacher, admin, staff):**
Título: "Asistente Virtual de Protocolos"
Tono: Formal, institucional, empático pero profesional
Lenguaje: Técnico, normativa educativa

CONTEXTO ECUADOR:
- Eres experto en la normativa educativa de Ecuador (LOEI, Reglamento General y Protocolos de Violencia del MINEDUC).

OBJETIVOS CON ADULTOS:
1. Eficiencia y Objetividad: Recopila datos para la "Ficha de Registro de Hechos de Violencia".
2. Marco Legal: Basa respuestas en protección de derechos.
3. Orientación: Explica la activación del DECE y autoridades (Junta Cantonal, UDAI).
4. INTENTA AYUDAR PRIMERO: Ofrece pasos concretos, protocolos o acciones que el adulto pueda implementar.

REGLAS DE TONO CON ADULTOS:
- Formal, institucional y empático.
- Use terminología correcta: "Rutas y Protocolos", "Medidas de Protección".
- Si es un conflicto leve: sugiere documentación y comunicación con la institución educativa.
- Si hay violencia: explica protocolos MINEDUC, rutas de denuncia (DECE, Fiscalía, ECU 911 si hay riesgo).
- NUNCA digas "No puedo ayudarte" o "Eso le corresponde a autoridades". Explica QUÉ HACER y CÓMO hacerlo.

**REGLAS UNIVERSALES (APLICAN A TODOS LOS USUARIOS):**

REGLA DE PRIORIDAD: INTENTA SIEMPRE AYUDAR PRIMERO
1. Escucha activamente y valida el problema.
2. Ofrece estrategias, consejos o pasos concretos que el usuario PUEDE implementar ya.
3. Si hay conflicto: propón diálogo, mediación, comunicación clara.
4. Si hay acoso: sugiere documentar, avisar a docentes, hablar con padres/adultos de confianza.
5. Si hay violencia leve: orienta sobre cómo reportar a autoridades escolares.
6. SOLO después de agotar opciones, considera derivar al DECE.

REGLA CRÍTICA DE ESCALAMIENTO:
NUNCA digas que eres un bot, IA o que "no puedes hacer algo". NUNCA.
Solo después de intentar ayudar exhaustivamente, si realmente necesitas derivar, usa ÚNICAMENTE esta frase:
"No estoy en facultad de resolver esto, por ende remitiré tu caso al DECE para que puedan continuar con el mismo. Por favor presiona el botón de finalizar y enviar reporte para que el DECE pueda proseguir."
Esta frase se usa SOLO en casos extremos donde el usuario necesita intervención directa que requiere contacto físico o decisiones legales que solo profesionales pueden tomar.

**IMPORTANTE:** El mensaje del usuario SIEMPRE vendrá con el contexto de su rol.
Detecta frases como "[Usuario: Estudiante]", "[Usuario: Padre]", "[Usuario: Docente]" al inicio del mensaje.
Si no ves el contexto explícito, infiere del contenido y tono del mensaje si es un estudiante o adulto.
```

### Paso 4: Configuración Adicional

En la misma pantalla de edición del deployment:

- **Temperature**: `0.7` (balance entre empatía y consistencia)
- **Max response tokens**: `800`
- **Top P**: `1.0`
- **Frequency penalty**: `0.0`
- **Presence penalty**: `0.0`

### Paso 5: Guardar

1. Click en **"Save"** o **"Update"**
2. Espera a que el deployment se actualice (puede tomar 1-2 minutos)

---

## 🧪 Probar la Configuración

### Test 1: Verificar Endpoint

Abre una terminal y ejecuta:

```bash
curl https://cuentame.services.ai.azure.com/openai/deployments/CuentameBot/chat/completions?api-version=2024-02-15-preview \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR-REGENERATED-API-KEY" \
  -d '{
    "messages": [
      {"role": "user", "content": "[Usuario: Estudiante] Hola"}
    ],
    "max_tokens": 100
  }'
```

**Respuesta esperada:** Un mensaje cálido y empático del agente

### Test 2: Verificar Adaptabilidad

**Como Estudiante:**
```json
{
  "messages": [
    {"role": "user", "content": "[Usuario: Estudiante] Tengo un problema con un compañero"}
  ]
}
```

**Como Adulto:**
```json
{
  "messages": [
    {"role": "user", "content": "[Usuario: Padre] Necesito reportar un incidente"}
  ]
}
```

---

## 🔄 Actualizar tu Código Backend

El servicio `azureFoundryAgentService.js` ya está actualizado para usar la estructura correcta.

Solo asegúrate de que tu `server.js` importe y use este servicio:

```javascript
const {
  sendMessageToAzureFoundryAgent,
  classifyCaseWithAzureFoundryAgent
} = require('./services/azureFoundryAgentService');

// Ruta de chat
app.post('/api/azure-foundry/chat', async (req, res) => {
  try {
    const { history, newMessage, userRole } = req.body;
    const response = await sendMessageToAzureFoundryAgent(history, newMessage, userRole);
    res.json({ response });
  } catch (error) {
    console.error('Azure Foundry Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🚨 Solución de Problemas

### Error 401: "Access denied"

**Causa:** API Key incorrecta o endpoint mal formado

**Solución:**
1. Verifica que la API Key sea exacta (copia/pega sin espacios)
2. Verifica que el endpoint NO incluya rutas adicionales
3. El endpoint debe ser: `https://cuentame.services.ai.azure.com`
4. NO uses: `https://cuentame.services.ai.azure.com/api/projects/...`

### Error 404: "Resource not found"

**Causa:** Deployment name incorrecto o no existe

**Solución:**
1. Ve a Azure AI Foundry → Model deployments
2. Verifica el nombre exacto de tu deployment
3. Usa ese nombre en `AZURE_FOUNDRY_AGENT_ID`

### El agente no adapta su tono

**Causa:** Las instrucciones no están configuradas en el deployment

**Solución:**
1. Ve al deployment en Azure AI Foundry
2. Edita el "System message"
3. Pega las instrucciones completas del Paso 3
4. Guarda y espera la actualización

### El agente responde pero ignora el contexto `[Usuario: ...]`

**Causa:** Las instrucciones no mencionan cómo detectar el contexto

**Solución:**
1. Verifica que las instrucciones incluyan la sección:
   ```
   **IMPORTANTE:** El mensaje del usuario SIEMPRE vendrá con el contexto de su rol.
   Detecta frases como "[Usuario: Estudiante]"...
   ```
2. Si no está, agrega esa sección al final de las instrucciones

---

## ✅ Checklist de Configuración

- [ ] Variables de entorno actualizadas en `.env`
- [ ] Deployment "CuentameBot" existe en Azure AI Foundry
- [ ] System message configurado con instrucciones adaptables
- [ ] Temperature establecida en 0.7
- [ ] Max tokens establecido en 800
- [ ] Código backend usando `azureFoundryAgentService.js`
- [ ] Pruebas exitosas con curl o Postman
- [ ] Prueba con estudiante exitosa
- [ ] Prueba con adulto exitosa

---

## 🎯 Resultado Esperado

Después de esta configuración:

✅ El agente responde correctamente (sin error 401)
✅ Detecta automáticamente si el usuario es estudiante o adulto
✅ Adapta su tono según el tipo de usuario
✅ Mantiene las instrucciones centralizadas en Azure
✅ Puedes actualizar las instrucciones sin redesplegar código

---

## 📞 Siguiente Paso

Una vez que hayas:
1. ✅ Actualizado el `.env` con los valores correctos
2. ✅ Configurado las instrucciones en Azure AI Foundry
3. ✅ Reiniciado tu servidor

Prueba nuevamente y el error 401 debería desaparecer. 🚀
