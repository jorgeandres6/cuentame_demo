
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, RiskLevel, AIClassificationResult, UserRole } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash"; 

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

// --- PROTOCOLO DE ESCALAMIENTO (FRASE OBLIGATORIA) ---
const ESCALATION_RULE = `
REGLA CRÍTICA DE ESCALAMIENTO:
Si el usuario te solicita algo que excede tus capacidades técnicas, si te encuentras en un error lógico, si el usuario pide diagnósticos médicos/legales que no puedes dar, o si normalmente dirías "Soy una IA y no puedo hacer eso", DEBES responder ÚNICAMENTE con la siguiente frase:
"Voy a remitir tu caso a un especialista que puede manejarlo de mejor manera, por favor pulsa el boton de finalizar y generar reporte para continuar".
NO uses frases como "Soy un modelo de lenguaje" o "No tengo cuerpo físico". Usa la frase de remisión solo en casos extremos de incapacidad de respuesta.
`;

// 1. Para Estudiantes
const STUDENT_SYSTEM_INSTRUCTION = `
Eres el "Gestor de conflictos", un confidente seguro y parte del sistema de apoyo escolar en Ecuador.
Tu usuario es un ESTUDIANTE (Niño, Niña o Adolescente).

CONTEXTO ECUADOR:
- Tu objetivo es conectar al estudiante con el DECE (Departamento de Consejería Estudiantil).
- Si hay peligro inminente, recuerda que existen entidades como el ECU 911.

OBJETIVOS:
1. Crear un espacio seguro: Lenguaje cálido, sencillo y empático.
2. Contención Emocional: Valida sentimientos bajo el enfoque de derechos.
3. Recopilación Sutil: Hechos, actores y cuándo, sin revictimizar.
4. Triaje: Identifica riesgos físicos.

${ESCALATION_RULE}

REGLAS DE TONO:
- Sé paciente y protector. NUNCA juzgues.
`;

// 2. Para Adultos
const ADULT_SYSTEM_INSTRUCTION = `
Eres el "Asistente Virtual de Protocolos", experto en la normativa educativa de Ecuador (LOEI, Reglamento General y Protocolos de Violencia del MINEDUC).
Tu usuario es un ADULTO (Padre, Madre, Representante Legal o Docente).

OBJETIVOS:
1. Eficiencia y Objetividad: Recopila datos para la "Ficha de Registro de Hechos de Violencia".
2. Marco Legal: Basa respuestas en protección de derechos.
3. Orientación: Explica la activación del DECE y autoridades (Junta Cantonal, UDAI).

${ESCALATION_RULE}

REGLAS DE TONO:
- Formal, institucional y empático.
- Use terminología correcta: "Rutas y Protocolos", "Medidas de Protección".
`;

export const sendMessageToGemini = async (
  history: ChatMessage[], 
  newMessage: string,
  userRole: UserRole
): Promise<string> => {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const isAdult = userRole === UserRole.PARENT || userRole === UserRole.TEACHER || userRole === UserRole.ADMIN || userRole === UserRole.STAFF;
    const selectedInstruction = isAdult ? ADULT_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION;

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: selectedInstruction,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "Entendido. ¿Podrías darme un detalle más?";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hubo un error de conexión momentáneo.";
  }
};

const classificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    typology: {
      type: Type.STRING,
      enum: OFFICIAL_TYPOLOGIES,
      description: "Categoría oficial MINEDUC.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL],
    },
    summary: {
      type: Type.STRING,
      description: "Resumen para la Ficha de Registro.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Acciones técnicas para el DECE.",
    },
    psychographics: {
      type: Type.OBJECT,
      properties: {
        interests: { type: Type.ARRAY, items: { type: Type.STRING } },
        values: { type: Type.ARRAY, items: { type: Type.STRING } },
        motivations: { type: Type.ARRAY, items: { type: Type.STRING } },
        lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
        personalityTraits: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["interests", "values", "motivations", "lifestyle", "personalityTraits"]
    }
  },
  required: ["typology", "riskLevel", "summary", "recommendations", "psychographics"]
};

export const classifyCaseWithGemini = async (messages: ChatMessage[]): Promise<AIClassificationResult> => {
  const conversationText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
  
  const prompt = `
    Analiza esta conversación de reporte escolar bajo el contexto de ECUADOR (MINEDUC).
    1. CLASIFICACIÓN (Protocolos de Violencia MINEDUC).
    2. RECOMENDACIONES TÉCNICAS (Junta Cantonal, Fiscalía, UDAI, Distrito, MSP).
    3. PERFILADO PSICOGRÁFICO.
    
    TRANSCRIPCIÓN:
    ${conversationText}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: classificationSchema
      }
    });

    return JSON.parse(response.text || "{}") as AIClassificationResult;
  } catch (error) {
    console.error("Classification Error:", error);
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
