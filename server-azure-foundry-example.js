/**
 * Azure Foundry Backend Implementation Example
 * 
 * This file provides a reference implementation for integrating Azure AI Foundry
 * with your Express backend. Add these endpoints to your existing server.js file.
 * 
 * Prerequisites:
 * - npm install @azure/openai (or appropriate Azure SDK)
 * - Configure environment variables in .env file
 */

// Required dependencies
// const { AzureOpenAI } = require("@azure/openai");
// Or use axios/fetch for REST API calls

/**
 * Azure Foundry Configuration
 * Add these environment variables to your .env file:
 * 
 * AZURE_FOUNDRY_ENDPOINT=https://your-foundry-endpoint.azure.com
 * AZURE_FOUNDRY_API_KEY=your-api-key-here
 * AZURE_FOUNDRY_DEPLOYMENT_NAME=your-deployment-name
 * AZURE_FOUNDRY_API_VERSION=2024-01-01
 */

// Initialize Azure Foundry client
// Example using REST API approach:
const axios = require('axios');

const azureFoundryConfig = {
  endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
  apiKey: process.env.AZURE_FOUNDRY_API_KEY,
  deploymentName: process.env.AZURE_FOUNDRY_DEPLOYMENT_NAME,
  apiVersion: process.env.AZURE_FOUNDRY_API_VERSION || '2024-01-01'
};

// System instructions (imported from azureFoundryService.ts)
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

REGLAS DE TONO:
- Sé paciente y protector. NUNCA juzgues.
- Si el estudiante describe un conflicto: ofrece estrategias de comunicación, mediación o pasos para hablar con un adulto de confianza.
- Si describe acoso: orienta sobre cómo documentar, avisar a un docente o llamar a sus padres.
- Si describe violencia: mantén calma, ofrece lugares seguros (docente, director, hospital) y luego deriva al DECE/autoridades.
`;

const ADULT_SYSTEM_INSTRUCTION = `
Eres el "Asistente Virtual de Protocolos", experto en la normativa educativa de Ecuador (LOEI, Reglamento General y Protocolos de Violencia del MINEDUC).
Tu usuario es un ADULTO (Padre, Madre, Representante Legal o Docente).

OBJETIVOS:
1. Eficiencia y Objetividad: Recopila datos para la "Ficha de Registro de Hechos de Violencia".
2. Marco Legal: Basa respuestas en protección de derechos.
3. Orientación: Explica la activación del DECE y autoridades (Junta Cantonal, UDAI).
4. INTENTA AYUDAR PRIMERO: Ofrece pasos concretos, protocolos o acciones que el adulto pueda implementar.

REGLAS DE TONO:
- Formal, institucional y empático.
- Use terminología correcta: "Rutas y Protocolos", "Medidas de Protección".
- Si es un conflicto leve: sugiere documentación y comunicación con la institución educativa.
- Si hay violencia: explica protocolos MINEDUC, rutas de denuncia (DECE, Fiscalía, ECU 911 si hay riesgo).
- NUNCA digas "No puedo ayudarte" o "Eso le corresponde a autoridades". Explica QUÉ HACER y CÓMO hacerlo.
`;

/**
 * Helper function to call Azure Foundry Agent
 */
async function callAzureFoundryAgent(messages, systemInstruction) {
  try {
    const url = `${azureFoundryConfig.endpoint}/openai/deployments/${azureFoundryConfig.deploymentName}/chat/completions?api-version=${azureFoundryConfig.apiVersion}`;
    
    const response = await axios.post(url, {
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || msg.text
        }))
      ],
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.95
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureFoundryConfig.apiKey
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Azure Foundry API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Chat Endpoint
 * POST /api/azure-foundry/chat
 * 
 * Request body:
 * {
 *   history: ChatMessage[],
 *   newMessage: string,
 *   userRole: 'student' | 'parent' | 'teacher' | 'admin' | 'staff'
 * }
 */
async function handleAzureFoundryChat(req, res) {
  try {
    const { history, newMessage, userRole } = req.body;

    // Determine system instruction based on user role
    const isAdult = ['parent', 'teacher', 'admin', 'staff'].includes(userRole);
    const systemInstruction = isAdult ? ADULT_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION;

    // Convert history to Azure format and add new message
    const messages = [
      ...history.map(msg => ({
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: newMessage }
    ];

    // Call Azure Foundry Agent
    const responseText = await callAzureFoundryAgent(messages, systemInstruction);

    res.json({ response: responseText });
  } catch (error) {
    console.error('Azure Foundry Chat Error:', error);
    res.status(500).json({ 
      error: 'Error communicating with Azure Foundry Agent',
      details: error.message 
    });
  }
}

/**
 * Classification Endpoint
 * POST /api/azure-foundry/classify
 * 
 * Request body:
 * {
 *   messages: ChatMessage[]
 * }
 */
async function handleAzureFoundryClassification(req, res) {
  try {
    const { messages } = req.body;

    // Build conversation summary for classification
    const conversationText = messages
      .map(msg => `${msg.sender === 'ai' ? 'Agente' : 'Usuario'}: ${msg.text}`)
      .join('\n\n');

    const classificationPrompt = `
Analiza la siguiente conversación y clasifícala según los protocolos del MINEDUC Ecuador.

Conversación:
${conversationText}

Proporciona una clasificación en formato JSON con:
{
  "typology": "Una de: Conflicto leve entre pares, Acoso escolar (bullying), Violencia física grave, Violencia sexual, Violencia intrafamiliar detectada, Discriminación o xenofobia, Ideación suicida o autolesiones, Violencia digital, Abandono escolar o negligencia, Conflicto docente-estudiante",
  "riskLevel": "low | medium | high | critical",
  "summary": "Resumen ejecutivo del caso para la Ficha de Registro (2-3 oraciones)",
  "recommendations": ["Lista de 3-5 recomendaciones técnicas para el DECE"],
  "psychographics": {
    "interests": ["intereses identificados"],
    "values": ["valores identificados"],
    "motivations": ["motivaciones identificadas"],
    "lifestyle": ["aspectos del estilo de vida"],
    "personalityTraits": ["rasgos de personalidad identificados"]
  }
}

Responde SOLO con el JSON, sin texto adicional.
`;

    const systemInstruction = `Eres un experto en análisis de casos educativos según normativa MINEDUC Ecuador. 
Clasifica casos basándote en protocolos de violencia, rutas de actuación y enfoque de derechos.
Proporciona respuestas estructuradas en JSON.`;

    const classificationMessages = [
      { role: 'user', content: classificationPrompt }
    ];

    const responseText = await callAzureFoundryAgent(classificationMessages, systemInstruction);

    // Parse JSON response
    let classification;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      classification = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse classification JSON:', responseText);
      throw new Error('Invalid classification response format');
    }

    res.json(classification);
  } catch (error) {
    console.error('Azure Foundry Classification Error:', error);
    res.status(500).json({
      typology: "Conflicto leve entre pares",
      riskLevel: "medium",
      summary: "Error en clasificación automática. Revisión manual requerida.",
      recommendations: ["Entrevista DECE"],
      psychographics: {
        interests: [],
        values: [],
        motivations: [],
        lifestyle: [],
        personalityTraits: []
      }
    });
  }
}

/**
 * Add these routes to your Express app:
 * 
 * app.post('/api/azure-foundry/chat', handleAzureFoundryChat);
 * app.post('/api/azure-foundry/classify', handleAzureFoundryClassification);
 */

module.exports = {
  handleAzureFoundryChat,
  handleAzureFoundryClassification,
  azureFoundryConfig
};
