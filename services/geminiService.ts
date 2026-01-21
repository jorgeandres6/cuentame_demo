
import { Type } from "@google/genai";
import { ChatMessage, RiskLevel, AIClassificationResult, UserRole } from "../types";

// API endpoint for backend calls - use relative path for same domain
const API_BASE = process.env.REACT_APP_API_URL || ''; 

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
NUNCA digas que eres un bot, IA o que "no puedes hacer algo". NUNCA.
Solo después de intentar ayudar exhaustivamente, si realmente necesitas derivar, usa ÚNICAMENTE esta frase:
"No estoy en facultad de resolver esto, por ende remitiré tu caso al DECE para que puedan continuar con el mismo. Por favor presiona el botón de finalizar y enviar reporte para que el DECE pueda proseguir."
Esta frase se usa SOLO en casos extremos donde el usuario necesita intervención directa que requiere contacto físico o decisiones legales que solo profesionales pueden tomar.
`;

// --- PROTOCOLO DE INTENTAR SOLUCIONAR PRIMERO ---
const ATTEMPT_SOLUTION_RULE = `
REGLA DE PRIORIDAD: INTENTA SIEMPRE AYUDAR PRIMERO
1. Escucha activamente y valida el problema.
2. Ofrece estrategias, consejos o pasos concretos que el usuario PUEDE implementar ya.
3. Si hay conflicto: propón diálogo, mediación, comunicación clara.
4. Si hay acoso: sugiere documentar, avisar a docentes, hablar con padres/adultos de confianza.
5. Si hay violencia leve: orienta sobre cómo reportar a autoridades escolares.
6. SOLO después de agotar opciones, considera derivar al DECE.
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
5. INTENTA AYUDAR PRIMERO: Ofrece estrategias concretas que el estudiante pueda usar ya.

${ATTEMPT_SOLUTION_RULE}

${ESCALATION_RULE}

REGLAS DE TONO:
- Sé paciente y protector. NUNCA juzgues.
- Si el estudiante describe un conflicto: ofrece estrategias de comunicación, mediación o pasos para hablar con un adulto de confianza.
- Si describe acoso: orienta sobre cómo documentar, avisar a un docente o llamar a sus padres.
- Si describe violencia: mantén calma, ofrece lugares seguros (docente, director, hospital) y luego deriva al DECE/autoridades.
`;

// 2. Para Adultos
const ADULT_SYSTEM_INSTRUCTION = `
Eres el "Asistente Virtual de Protocolos", experto en la normativa educativa de Ecuador (LOEI, Reglamento General y Protocolos de Violencia del MINEDUC).
Tu usuario es un ADULTO (Padre, Madre, Representante Legal o Docente).

OBJETIVOS:
1. Eficiencia y Objetividad: Recopila datos para la "Ficha de Registro de Hechos de Violencia".
2. Marco Legal: Basa respuestas en protección de derechos.
3. Orientación: Explica la activación del DECE y autoridades (Junta Cantonal, UDAI).
4. INTENTA AYUDAR PRIMERO: Ofrece pasos concretos, protocolos o acciones que el adulto pueda implementar.

${ATTEMPT_SOLUTION_RULE}

${ESCALATION_RULE}

REGLAS DE TONO:
- Formal, institucional y empático.
- Use terminología correcta: "Rutas y Protocolos", "Medidas de Protección".
- Si es un conflicto leve: sugiere documentación y comunicación con la institución educativa.
- Si hay violencia: explica protocolos MINEDUC, rutas de denuncia (DECE, Fiscalía, ECU 911 si hay riesgo).
- NUNCA digas "No puedo ayudarte" o "Eso le corresponde a autoridades". Explica QUÉ HACER y CÓMO hacerlo.
`;

export const sendMessageToGemini = async (
  history: ChatMessage[], 
  newMessage: string,
  userRole: UserRole
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history, newMessage, userRole })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Entendido. ¿Podrías darme un detalle más?";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hubo un error de conexión momentáneo.";
  }
};

const classificationSchema = {
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
  try {
    const response = await fetch(`${API_BASE}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json() as AIClassificationResult;
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
