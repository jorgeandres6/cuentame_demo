
import { ChatMessage, RiskLevel, AIClassificationResult, UserRole } from "../types";

// API endpoint for backend calls - use relative path for same domain
const API_BASE = process.env.REACT_APP_API_URL || ''; 

// Tipologías oficiales para clasificación
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
 * NOTA: Las instrucciones del sistema ahora están configuradas en Azure Foundry.
 * 
 * Se han creado dos agentes separados:
 * 1. Gestor de Conflictos - Estudiantes (para niños, niñas y adolescentes)
 * 2. Asistente de Protocolos - Adultos (para padres, representantes y docentes)
 * 
 * Las instrucciones completas se encuentran en: AZURE_FOUNDRY_AGENT_INSTRUCTIONS.md
 * 
 * El backend automáticamente seleccionará el agente correcto basado en el userRole.
 */

/**
 * Send message to Azure Foundry Agent
 * @param history - Chat message history
 * @param newMessage - New user message
 * @param userRole - Role of the user (student or adult)
 * @param userProfile - Complete user profile with sociographic and psychographic data
 * @returns Agent's response message
 */
export const sendMessageToAzureFoundry = async (
  history: ChatMessage[], 
  newMessage: string,
  userRole: UserRole,
  userProfile?: { psychographics?: any; sociographics?: any; grade?: string; }
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/azure-foundry/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, newMessage, userRole, userProfile })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Entendido. ¿Podrías darme un detalle más?";

  } catch (error) {
    console.error("Azure Foundry Chat Error:", error);
    return "Hubo un error de conexión momentáneo.";
  }
};

/**
 * Classify case using Azure Foundry Agent
 * @param messages - Complete chat message history
 * @returns AI classification result with typology, risk level, and recommendations
 */
export const classifyCaseWithAzureFoundry = async (messages: ChatMessage[]): Promise<AIClassificationResult> => {
  try {
    const response = await fetch(`${API_BASE}/api/azure-foundry/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json() as AIClassificationResult;
  } catch (error) {
    console.error("Azure Foundry Classification Error:", error);
    return {
      typology: "Conflicto leve entre pares",
      riskLevel: RiskLevel.MEDIUM,
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
};

// Export tipologías oficiales para uso en clasificación
export { OFFICIAL_TYPOLOGIES };
