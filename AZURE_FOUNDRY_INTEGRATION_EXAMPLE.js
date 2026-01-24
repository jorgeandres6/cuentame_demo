/**
 * EJEMPLO DE INTEGRACIÓN DE AZURE FOUNDRY AGENTS EN SERVER.JS
 * 
 * Este archivo muestra cómo actualizar las rutas de tu servidor Express
 * para usar los agentes de Azure Foundry en lugar de instrucciones hardcodeadas.
 * 
 * PASOS PARA INTEGRAR:
 * 1. Importa el nuevo servicio
 * 2. Actualiza la ruta /api/azure-foundry/chat
 * 3. Actualiza la ruta /api/azure-foundry/classify
 * 4. Actualiza tus variables de entorno (.env)
 */

// ============================================
// PASO 1: IMPORTAR EL NUEVO SERVICIO
// ============================================

const {
  sendMessageToAzureFoundryAgent,
  classifyCaseWithAzureFoundryAgent
} = require('./services/azureFoundryAgentService');

// ============================================
// PASO 2: ACTUALIZAR RUTA DE CHAT
// ============================================

/**
 * ANTES (con instrucciones hardcodeadas):
 * 
 * app.post('/api/azure-foundry/chat', async (req, res) => {
 *   try {
 *     const { history, newMessage, userRole } = req.body;
 *     const isAdult = ['parent', 'teacher', 'admin', 'staff'].includes(userRole);
 *     const systemInstruction = isAdult ? ADULT_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION;
 *     
 *     // ... código que envía systemInstruction a Azure Foundry
 *   }
 * });
 */

/**
 * DESPUÉS (usando agentes configurados):
 */
app.post('/api/azure-foundry/chat', async (req, res) => {
  try {
    const { history, newMessage, userRole } = req.body;

    // Validación básica
    if (!history || !newMessage || !userRole) {
      return res.status(400).json({ 
        error: 'Missing required fields: history, newMessage, userRole' 
      });
    }

    // El servicio selecciona automáticamente el agente correcto según userRole
    const response = await sendMessageToAzureFoundryAgent(history, newMessage, userRole);
    
    res.json({ response });

  } catch (error) {
    console.error('Azure Foundry Chat Error:', error);
    res.status(500).json({ 
      error: 'Error communicating with Azure Foundry',
      message: error.message 
    });
  }
});

// ============================================
// PASO 3: ACTUALIZAR RUTA DE CLASIFICACIÓN
// ============================================

/**
 * ANTES (con instrucciones hardcodeadas):
 * 
 * app.post('/api/azure-foundry/classify', async (req, res) => {
 *   try {
 *     const { messages } = req.body;
 *     const systemInstruction = "Clasifica este caso..."; // Instrucción hardcodeada
 *     
 *     // ... código que envía systemInstruction
 *   }
 * });
 */

/**
 * DESPUÉS (usando agentes configurados):
 */
app.post('/api/azure-foundry/classify', async (req, res) => {
  try {
    const { messages, userRole } = req.body;

    // Validación básica
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Missing or invalid messages array' 
      });
    }

    // El servicio usa el agente correcto y envía un prompt de clasificación
    const classification = await classifyCaseWithAzureFoundryAgent(
      messages, 
      userRole || 'student'
    );
    
    res.json(classification);

  } catch (error) {
    console.error('Azure Foundry Classification Error:', error);
    res.status(500).json({ 
      error: 'Error classifying case',
      message: error.message 
    });
  }
});

// ============================================
// PASO 4: VARIABLES DE ENTORNO (.env)
// ============================================

/**
 * Agrega estas variables a tu archivo .env:
 * 
 * # Azure Foundry Configuration
 * AZURE_FOUNDRY_API_KEY=tu-api-key-aqui
 * AZURE_FOUNDRY_ENDPOINT=https://tu-endpoint.azurewebsites.net
 * AZURE_FOUNDRY_PROJECT_ID=tu-project-id
 * 
 * # Agent IDs (obtenidos después de crear los agentes en Azure Foundry)
 * AZURE_FOUNDRY_STUDENT_AGENT_ID=agent-id-estudiantes
 * AZURE_FOUNDRY_ADULT_AGENT_ID=agent-id-adultos
 */

// ============================================
// PASO 5: HEALTH CHECK (OPCIONAL)
// ============================================

/**
 * Ruta para verificar la configuración de Azure Foundry
 */
app.get('/api/azure-foundry/health', (req, res) => {
  const config = {
    hasApiKey: !!process.env.AZURE_FOUNDRY_API_KEY,
    hasEndpoint: !!process.env.AZURE_FOUNDRY_ENDPOINT,
    hasProjectId: !!process.env.AZURE_FOUNDRY_PROJECT_ID,
    hasStudentAgent: !!process.env.AZURE_FOUNDRY_STUDENT_AGENT_ID,
    hasAdultAgent: !!process.env.AZURE_FOUNDRY_ADULT_AGENT_ID
  };

  const isConfigured = Object.values(config).every(v => v === true);

  res.json({
    status: isConfigured ? 'ready' : 'incomplete',
    configuration: config,
    message: isConfigured 
      ? 'Azure Foundry Agents are properly configured'
      : 'Missing Azure Foundry configuration. Check environment variables.'
  });
});

// ============================================
// NOTAS IMPORTANTES
// ============================================

/**
 * VENTAJAS DE ESTA MIGRACIÓN:
 * 
 * 1. ✅ Código más limpio y mantenible
 * 2. ✅ Instrucciones centralizadas en Azure Foundry
 * 3. ✅ Fácil actualización sin redesplegar código
 * 4. ✅ Versionamiento de instrucciones en la plataforma
 * 5. ✅ Mejor separación de responsabilidades
 * 6. ✅ Soporte para A/B testing de diferentes instrucciones
 * 
 * CONSIDERACIONES:
 * 
 * - Asegúrate de que los Agent IDs sean correctos
 * - La estructura de respuesta de Azure Foundry puede variar
 * - Ajusta el código según tu implementación específica
 * - Mantén un fallback para errores de API
 * - Documenta qué agente usar para cada tipo de usuario
 */

module.exports = {
  // Exporta las rutas si usas módulos separados
};
