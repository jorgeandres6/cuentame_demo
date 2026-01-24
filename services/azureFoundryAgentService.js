/**
 * AZURE FOUNDRY SERVICE - BACKEND
 * 
 * Este servicio maneja la comunicación con Azure Foundry usando agentes configurados
 * en la plataforma en lugar de instrucciones hardcodeadas.
 * 
 * CONFIGURACIÓN REQUERIDA EN .env:
 * - AZURE_FOUNDRY_API_KEY
 * - AZURE_FOUNDRY_ENDPOINT
 * - AZURE_FOUNDRY_PROJECT_ID
 * - AZURE_FOUNDRY_STUDENT_AGENT_ID (Agente para estudiantes)
 * - AZURE_FOUNDRY_ADULT_AGENT_ID (Agente para adultos)
 */

const fetch = require('node-fetch');

// Configuración de Azure Foundry
const AZURE_FOUNDRY_CONFIG = {
  apiKey: process.env.AZURE_FOUNDRY_API_KEY,
  endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
  projectId: process.env.AZURE_FOUNDRY_PROJECT_ID,
  agentId: process.env.AZURE_FOUNDRY_AGENT_ID // Agente único adaptable
};

// Tipologías oficiales (se mantienen para validación)
const OFFICIAL_TYPOLOGIES = [
  "Conflicto leve entre pares",
  "Acoso escolar (bullying)",
  "Violencia física grave",
  "Violencia sexual",
  "Violencia intrafamiliar detectada",
  "Discriminación o xenofobia",
  "Ideación suicida o autolesiones",
  "Violencia digital",
  "Abandono escolar o negligencia",
  "Conflicto docente-estudiante"
];

/**
 * Formatea el rol del usuario para que el agente lo entienda
 * @param {string} userRole - Rol del usuario
 * @returns {string} Descripción del tipo de usuario
 */
function getUserRoleLabel(userRole) {
  const adultRoles = ['parent', 'teacher', 'admin', 'staff'];
  const isAdult = adultRoles.includes(userRole);
  
  if (isAdult) {
    const roleLabels = {
      parent: 'Padre/Madre',
      teacher: 'Docente',
      admin: 'Administrador',
      staff: 'Personal'
    };
    return roleLabels[userRole] || 'Adulto';
  }
  
  return 'Estudiante';
}

/**
 * Envía un mensaje al agente de Azure Foundry
 * @param {Array} history - Historial de mensajes del chat
 * @param {string} newMessage - Nuevo mensaje del usuario
 * @param {string} userRole - Rol del usuario
 * @returns {Promise<string>} Respuesta del agente
 */
async function sendMessageToAzureFoundryAgent(history, newMessage, userRole) {
  try {
    const agentId = AZURE_FOUNDRY_CONFIG.agentId;
    
    // Verificar configuración
    if (!AZURE_FOUNDRY_CONFIG.apiKey || !AZURE_FOUNDRY_CONFIG.endpoint || !agentId) {
      throw new Error('Azure Foundry not configured properly. Check environment variables.');
    }

    // Formatear historial para Azure Foundry
    const messages = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    // Agregar el nuevo mensaje CON contexto del rol del usuario
    const userRoleLabel = getUserRoleLabel(userRole);
    const messageWithContext = `[Usuario: ${userRoleLabel}] ${newMessage}`;
    
    messages.push({
      role: 'user',
      content: messageWithContext
    });

    // Llamar a Azure OpenAI API con deployment
    // Azure Foundry usa el mismo endpoint que Azure OpenAI Service
    const deploymentName = agentId; // En Azure, el deployment name es como el "agent"
    const apiVersion = '2024-02-15-preview';
    
    const url = `${AZURE_FOUNDRY_CONFIG.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_FOUNDRY_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure Foundry API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
    // Azure OpenAI API devuelve la respuesta en formato específico
    return data.choices?.[0]?.message?.content || 
           "Entendido. ¿Podrías darme un detalle más?";

  } catch (error) {
    console.error('Azure Foundry Agent Error:', error);
    throw error;
  }
}

/**
 * Clasifica un caso usando el agente de Azure Foundry
 * @param {Array} messages - Historial completo del chat
 * @param {string} userRole - Rol del usuario
 * @returns {Promise<Object>} Clasificación del caso
 */
async function classifyCaseWithAzureFoundryAgent(messages, userRole) {
  try {
    const agentId = AZURE_FOUNDRY_CONFIG.agentId;
    
    if (!AZURE_FOUNDRY_CONFIG.apiKey || !AZURE_FOUNDRY_CONFIG.endpoint || !agentId) {
      throw new Error('Azure Foundry not configured properly. Check environment variables.');
    }

    // Crear un prompt especial para clasificación
    const classificationPrompt = `
Analiza toda la conversación anterior y proporciona una clasificación del caso en formato JSON:

{
  "typology": "<una de las tipologías oficiales>",
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "summary": "<resumen breve del caso>",
  "recommendations": ["<acción 1>", "<acción 2>", ...],
  "psychographics": {
    "interests": [],
    "values": [],
    "motivations": [],
    "lifestyle": [],
    "personalityTraits": []
  }
}

Tipologías oficiales: ${OFFICIAL_TYPOLOGIES.join(', ')}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.
`;

    // Formatear mensajes + prompt de clasificación
    const formattedMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    formattedMessages.push({
      role: 'user',
      content: classificationPrompt
    });

    const deploymentName = agentId;
    const apiVersion = '2024-02-15-preview';
    const url = `${AZURE_FOUNDRY_CONFIG.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_FOUNDRY_CONFIG.apiKey
      },
      body: JSON.stringify({
        messages: formattedMessages,
        temperature: 0.3, // Más determinístico para clasificación
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Azure Foundry API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '{}';
    
    // Extraer JSON de la respuesta (puede venir con markdown)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const classification = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!classification) {
      throw new Error('No se pudo extraer clasificación JSON');
    }

    return {
      typology: classification.typology || "Conflicto leve entre pares",
      riskLevel: classification.riskLevel || "MEDIUM",
      summary: classification.summary || "Clasificación manual requerida",
      recommendations: classification.recommendations || ["Entrevista DECE"],
      psychographics: classification.psychographics || {
        interests: [],
        values: [],
        motivations: [],
        lifestyle: [],
        personalityTraits: []
      }
    };

  } catch (error) {
    console.error('Azure Foundry Classification Error:', error);
    
    // Fallback en caso de error
    return {
      typology: "Conflicto leve entre pares",
      riskLevel: "MEDIUM",
      summary: "Error en clasificación automática. Revisión manual requerida.",
      recommendations: ["Entrevista DECE"],
      psychographics: {
        interests: [],
        values: [],
        motivations: [],
        lifestyle: [],
        personalityTraits: []
      }
    };
  }
}

// Exportar funciones
module.exports = {
  sendMessageToAzureFoundryAgent,
  classifyCaseWithAzureFoundryAgent,
  OFFICIAL_TYPOLOGIES
};
