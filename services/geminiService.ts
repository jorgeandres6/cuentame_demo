
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, RiskLevel, AIClassificationResult, UserRole } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelId = "gemini-2.5-flash"; // Optimized for speed and logic

// Las 10 Tipologías oficiales del PDF (MINEDUC Ecuador)
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

// --- INSTRUCCIONES DEL SISTEMA SEGÚN ROL (CONTEXTO ECUADOR) ---

// 1. Para Estudiantes: Contexto DECE y protección local.
const STUDENT_SYSTEM_INSTRUCTION = `
Eres el "Gestor de conflictos", un confidente seguro y parte del sistema de apoyo escolar en Ecuador.
Tu usuario es un ESTUDIANTE (Niño, Niña o Adolescente).

CONTEXTO ECUADOR:
- Tu objetivo es conectar al estudiante con el DECE (Departamento de Consejería Estudiantil).
- Si hay peligro inminente, recuerda que existen entidades como el ECU 911.

OBJETIVOS:
1. Crear un espacio seguro: Usa un lenguaje cálido (voseo o tuteo suave según región, pero estándar neutro funciona bien), sencillo y empático.
2. Contención Emocional: Valida sus sentimientos bajo el enfoque de derechos del Código de la Niñez.
3. Recopilación Sutil: Averigua qué pasó (hechos), quiénes (actores) y cuándo, sin revictimizar.
4. Triaje: Identifica si hay riesgo físico inmediato para activar alertas.

REGLAS DE TONO:
- Sé paciente y protector.
- NUNCA juzgues.
- Si menciona suicidio, violencia sexual o drogas, mantén la calma, ofrece apoyo incondicional y prioriza obtener datos para que un adulto (DECE) intervenga inmediatamente.

ESTRUCTURA INICIAL:
- Si no sabes su nombre/alias, pregúntalo amablemente.
- Pregunta cómo se siente hoy.
`;

// 2. Para Adultos: Normativa LOEI, Protocolos MINEDUC, Código de la Niñez.
const ADULT_SYSTEM_INSTRUCTION = `
Eres el "Asistente Virtual de Protocolos", experto en la normativa educativa de Ecuador (LOEI, Reglamento General y Protocolos de Violencia del MINEDUC).
Tu usuario es un ADULTO (Padre, Madre, Representante Legal o Docente).

OBJETIVOS:
1. Eficiencia y Objetividad: Recopila los datos necesarios para llenar la "Ficha de Registro de Hechos de Violencia" del MINEDUC.
2. Marco Legal: Basa tus respuestas en la protección de derechos. Si es un delito, orienta sutilmente sobre la necesidad de denuncia externa (Fiscalía), pero enfatiza el reporte interno primero para activar la ruta.
3. Orientación: Explique que la institución activará al DECE y a las autoridades competentes (Junta Cantonal, UDAI) según corresponda.
4. Triaje Técnico: Clasifica el hecho para determinar si requiere separación temporal (medida de protección) o intervención educativa.

REGLAS DE TONO:
- Formal, institucional y empático.
- Use terminología correcta: "Rutas y Protocolos", "Medidas de Protección", "Restitución de Derechos".
- No prometa sanciones (eso es un proceso administrativo/disciplinario), prometa activación de protocolos.

ESTRUCTURA INICIAL:
- Confirma si reporta un hecho sobre su representado o si es testigo.
- Solicita descripción cronológica clara de los hechos.
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

    // Select instruction based on Role
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

// Schema for Phase 2 Classification matching MINEDUC Logic
const classificationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    typology: {
      type: Type.STRING,
      enum: OFFICIAL_TYPOLOGIES,
      description: "La categoría exacta según Protocolos MINEDUC.",
    },
    riskLevel: {
      type: Type.STRING,
      enum: [RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL],
      description: "Nivel de riesgo. Acoso=MEDIO, Sexual/Suicidio=CRÍTICO (Activar ECU911/Fiscalía).",
    },
    summary: {
      type: Type.STRING,
      description: "Resumen ejecutivo para la Ficha de Registro.",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de 3 a 5 acciones técnicas para el DECE/Rectorado (Ej: 'Derivar a UDAI', 'Notificar a Junta Cantonal', 'Activar Protocolo de Violencia Sexual').",
    },
    psychographics: {
      type: Type.OBJECT,
      description: "Perfilado psicográfico.",
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
    
    1. CLASIFICACIÓN (Lógica Protocolos de Violencia MINEDUC):
       - "Conflicto leve" -> Riesgo BAJO (Mediación escolar posible salvo violencia).
       - "Acoso escolar (bullying)" -> Riesgo MEDIO (Requiere intervención DECE + Autoridad).
       - "Violencia física grave" -> Riesgo ALTO.
       - "Violencia sexual" -> Riesgo CRÍTICO (Delito penal: Fiscalía obligatoria).
       - "Violencia intrafamiliar" -> Riesgo ALTO (Junta Cantonal de Protección de Derechos).
       - "Ideación suicida" -> Riesgo CRÍTICO (MSP / ECU 911).
    
    2. RECOMENDACIONES TÉCNICAS (Para el DECE/Rector):
       - Usa terminología ecuatoriana: "Junta Cantonal", "Fiscalía", "UDAI", "Distrito Educativo", "MSP".
       - Ejemplo: "Remitir informe a Fiscalía General del Estado", "Solicitar valoración psicopedagógica a UDAI", "Notificar a representantes legales según LOEI".
    
    3. PERFILADO: Extrae intereses, valores y estilo de vida implícitos.
    
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

    const result = JSON.parse(response.text || "{}");
    return result as AIClassificationResult;
  } catch (error) {
    console.error("Classification Error:", error);
    return {
      typology: "Conflicto leve entre pares",
      riskLevel: RiskLevel.MEDIUM,
      summary: "Error en clasificación automática. Revisión manual requerida.",
      recommendations: ["Entrevista DECE", "Revisión de Código de Convivencia"],
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
