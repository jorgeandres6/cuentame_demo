import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql';
import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } from '@azure/storage-blob';

dotenv.config();

// Necesario para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// ============ CONFIGURACIÓN AZURE SQL ============
const sqlConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'cuentame_db',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000,
    requestTimeout: 30000
  }
};

let pool;

// ============ CONFIGURACIÓN AZURE BLOB STORAGE ============
const AZURE_STORAGE_ACCOUNT = process.env.AZURE_STORAGE_ACCOUNT;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'case-evidence';

let blobServiceClient;
if (AZURE_STORAGE_ACCOUNT && AZURE_STORAGE_KEY) {
  try {
    const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT};AccountKey=${AZURE_STORAGE_KEY};EndpointSuffix=core.windows.net`;
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    console.log('✅ Azure Blob Storage configured');
  } catch (error) {
    console.warn('⚠️  Azure Blob Storage config failed:', error.message);
  }
} else {
  console.warn('⚠️  Azure Blob Storage not configured (missing AZURE_STORAGE_ACCOUNT or AZURE_STORAGE_KEY)');
}

// ============ CONFIGURACIÓN AZURE FOUNDRY ============
const azureFoundryConfig = {
  endpoint: process.env.AZURE_FOUNDRY_ENDPOINT,
  apiKey: process.env.AZURE_FOUNDRY_API_KEY,
  deploymentName: process.env.AZURE_FOUNDRY_DEPLOYMENT_NAME || 'CuentameBot',
  apiVersion: process.env.AZURE_FOUNDRY_API_VERSION || '2024-02-15-preview'
};

if (azureFoundryConfig.endpoint && azureFoundryConfig.apiKey) {
  console.log('✅ Azure Foundry Agent configured');
} else {
  console.warn('⚠️  Azure Foundry not configured (missing endpoint or API key)');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini with API key from environment
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelId = "gemini-2.5-flash";

// --- TYPOLOGIES ---
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

// --- ESCALATION RULE ---
const ESCALATION_RULE = `
REGLA CRÍTICA DE ESCALAMIENTO:
Si el usuario te solicita algo que excede tus capacidades técnicas, si te encuentras en un error lógico, si el usuario pide diagnósticos médicos/legales que no puedes dar, o si normalmente dirías "Soy una IA y no puedo hacer eso", DEBES responder ÚNICAMENTE con la siguiente frase:
"Voy a remitir tu caso a un especialista que puede manejarlo de mejor manera, por favor pulsa el boton de finalizar y generar reporte para continuar".
NO uses frases como "Soy un modelo de lenguaje" o "No tengo cuerpo físico". Usa la frase de remisión solo en casos extremos de incapacidad de respuesta.
`;

// --- STUDENT INSTRUCTIONS ---
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

// --- ADULT INSTRUCTIONS ---
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

// --- CLASSIFICATION SCHEMA ---
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
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { history, newMessage, userRole, userProfile } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const isAdult = ['parent', 'teacher', 'admin', 'staff'].includes(userRole);
    let selectedInstruction = isAdult ? ADULT_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION;

    // Enriquecer con contexto del usuario (igual que en Azure Foundry)
    if (userProfile) {
      let contextInfo = '\n\n--- CONTEXTO DEL USUARIO ---\n';
      
      if (userProfile.grade) {
        contextInfo += `Grado/Curso: ${userProfile.grade}\n`;
      }
      
      if (userProfile.psychographics) {
        const psycho = userProfile.psychographics;
        if (psycho.personalityTraits && psycho.personalityTraits.length > 0) {
          contextInfo += `Rasgos de personalidad: ${psycho.personalityTraits.join(', ')}\n`;
        }
        if (psycho.interests && psycho.interests.length > 0) {
          contextInfo += `Intereses: ${psycho.interests.join(', ')}\n`;
        }
        if (psycho.values && psycho.values.length > 0) {
          contextInfo += `Valores importantes: ${psycho.values.join(', ')}\n`;
        }
      }
      
      if (userProfile.sociographics) {
        const socio = userProfile.sociographics;
        if (socio.schoolName) {
          contextInfo += `Institución: ${socio.schoolName} (${socio.schoolType || 'N/A'})\n`;
        }
        if (socio.familyStructure) {
          contextInfo += `Estructura familiar: ${socio.familyStructure}\n`;
        }
        if (socio.socialSupport) {
          contextInfo += `Apoyo social: ${socio.socialSupport}\n`;
        }
        if (socio.socioeconomicStatus) {
          contextInfo += `Nivel socioeconómico: ${socio.socioeconomicStatus}\n`;
        }
      }
      
      contextInfo += '\nUSA ESTE CONTEXTO para:\n';
      contextInfo += '1. Adaptar tu tono y lenguaje según los rasgos de personalidad\n';
      contextInfo += '2. Identificar factores de riesgo adicionales\n';
      contextInfo += '3. Personalizar recomendaciones\n';
      contextInfo += '4. Ser más empático si detectas vulnerabilidad\n';
      contextInfo += '--- FIN CONTEXTO ---\n';
      
      selectedInstruction += contextInfo;
    }

    const chatHistory = history.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: selectedInstruction,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: newMessage });
    res.json({ response: result.text || "Entendido. ¿Podrías darme un detalle más?" });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// Classification endpoint
app.post('/api/classify', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const conversationText = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
    
    const prompt = `
      Analiza esta conversación de reporte escolar bajo el contexto de ECUADOR (MINEDUC).
      1. CLASIFICACIÓN (Protocolos de Violencia MINEDUC).
      2. RECOMENDACIONES TÉCNICAS (Junta Cantonal, Fiscalía, UDAI, Distrito, MSP).
      3. PERFILADO PSICOGRÁFICO.
      
      TRANSCRIPCIÓN:
      ${conversationText}
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: classificationSchema
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error) {
    console.error('Classification Error:', error);
    res.status(500).json({ error: 'Failed to classify case' });
  }
});

// ============ AZURE FOUNDRY ENDPOINTS ============

/**
 * Helper function to call Azure Foundry Agent
 */
async function callAzureFoundryAgent(messages, systemInstruction) {
  try {
    const url = `${azureFoundryConfig.endpoint}/openai/deployments/${azureFoundryConfig.deploymentName}/chat/completions?api-version=${azureFoundryConfig.apiVersion}`;
    
    const response = await axios.post(url, {
      messages: [
        { role: 'system', content: systemInstruction },
        ...messages
      ],
      max_completion_tokens: 800
    }, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureFoundryConfig.apiKey
      },
      timeout: 30000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Azure Foundry API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Azure Foundry Chat Endpoint
 */
app.post('/api/azure-foundry/chat', async (req, res) => {
  try {
    const { history, newMessage, userRole, userProfile } = req.body;

    if (!azureFoundryConfig.endpoint || !azureFoundryConfig.apiKey) {
      return res.status(500).json({ error: 'Azure Foundry not configured' });
    }

    // Determine system instruction based on user role
    const isAdult = ['parent', 'teacher', 'admin', 'staff'].includes(userRole);
    let systemInstruction = isAdult ? ADULT_SYSTEM_INSTRUCTION : STUDENT_SYSTEM_INSTRUCTION;

    // Enriquecer system instruction con perfil del usuario si está disponible
    if (userProfile) {
      let contextInfo = '\n\n--- CONTEXTO DEL USUARIO ---\n';
      
      if (userProfile.grade) {
        contextInfo += `Grado/Curso: ${userProfile.grade}\n`;
      }
      
      if (userProfile.psychographics) {
        const psycho = userProfile.psychographics;
        if (psycho.personalityTraits && psycho.personalityTraits.length > 0) {
          contextInfo += `Rasgos de personalidad: ${psycho.personalityTraits.join(', ')}\n`;
        }
        if (psycho.interests && psycho.interests.length > 0) {
          contextInfo += `Intereses: ${psycho.interests.join(', ')}\n`;
        }
        if (psycho.values && psycho.values.length > 0) {
          contextInfo += `Valores importantes: ${psycho.values.join(', ')}\n`;
        }
      }
      
      if (userProfile.sociographics) {
        const socio = userProfile.sociographics;
        if (socio.schoolName) {
          contextInfo += `Institución: ${socio.schoolName} (${socio.schoolType || 'N/A'})\n`;
        }
        if (socio.familyStructure) {
          contextInfo += `Estructura familiar: ${socio.familyStructure}\n`;
        }
        if (socio.socialSupport) {
          contextInfo += `Apoyo social: ${socio.socialSupport}\n`;
        }
        if (socio.socioeconomicStatus) {
          contextInfo += `Nivel socioeconómico: ${socio.socioeconomicStatus}\n`;
        }
      }
      
      contextInfo += '\nUSA ESTE CONTEXTO para:\n';
      contextInfo += '1. Adaptar tu tono y lenguaje según los rasgos de personalidad\n';
      contextInfo += '2. Identificar factores de riesgo adicionales (apoyo social débil, vulnerabilidad)\n';
      contextInfo += '3. Personalizar recomendaciones según el contexto socioeconómico\n';
      contextInfo += '4. Ser más empático si detectas rasgos como "Sensible", "Ansioso"\n';
      contextInfo += '--- FIN CONTEXTO ---\n';
      
      systemInstruction += contextInfo;
    }

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
});

/**
 * Azure Foundry Classification Endpoint
 */
app.post('/api/azure-foundry/classify', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!azureFoundryConfig.endpoint || !azureFoundryConfig.apiKey) {
      return res.status(500).json({ error: 'Azure Foundry not configured' });
    }

    // Build conversation summary for classification
    const conversationText = messages
      .map(msg => `${msg.sender === 'ai' ? 'Agente' : 'Usuario'}: ${msg.text}`)
      .join('\\n\\n');

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
      const cleanedResponse = responseText.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();
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
});

// ============ INICIALIZAR CONEXIÓN A BD ============
async function initializeDatabase() {
  try {
    pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    console.log('✅ Conectado a Azure SQL Database');
    await createTables();
  } catch (error) {
    console.error('❌ Error conectando a BD:', error);
    // No fallar si la BD no está disponible en desarrollo
  }
}

// ============ CREAR TABLAS SI NO EXISTEN ============
async function createTables() {
  if (!pool) return;
  try {
    const request = pool.request();
    
    // Tabla de Usuarios
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserProfiles')
      CREATE TABLE UserProfiles (
        id NVARCHAR(50) PRIMARY KEY,
        fullName NVARCHAR(255) NOT NULL,
        encryptedCode NVARCHAR(50) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL,
        phone NVARCHAR(20),
        grade NVARCHAR(10),
        email NVARCHAR(255),
        demographics NVARCHAR(MAX),
        psychographics NVARCHAR(MAX),
        sociographics NVARCHAR(MAX),
        notifications NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETUTCDATE(),
        updatedAt DATETIME DEFAULT GETUTCDATE()
      );
    `);

    // Agregar columna sociographics si no existe (migración)
    await request.query(`
      IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'UserProfiles' AND COLUMN_NAME = 'sociographics'
      )
      BEGIN
        ALTER TABLE UserProfiles ADD sociographics NVARCHAR(MAX);
      END
    `);

    // Tabla de Casos
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConflictCases')
      CREATE TABLE ConflictCases (
        id NVARCHAR(50) PRIMARY KEY,
        encryptedUserCode NVARCHAR(50) NOT NULL,
        reporterRole NVARCHAR(20) NOT NULL,
        createdAt DATETIME DEFAULT GETUTCDATE(),
        updatedAt DATETIME DEFAULT GETUTCDATE(),
        status NVARCHAR(50) NOT NULL,
        typology NVARCHAR(255) NOT NULL,
        riskLevel NVARCHAR(20) NOT NULL,
        summary NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        assignedProtocol NVARCHAR(100),
        assignedTo NVARCHAR(255),
        messages NVARCHAR(MAX),
        interventions NVARCHAR(MAX),
        evidence NVARCHAR(MAX)
      );
    `);

    // Tabla de Conversaciones
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Conversations')
      CREATE TABLE Conversations (
        id NVARCHAR(50) PRIMARY KEY,
        participant1Code NVARCHAR(50) NOT NULL,
        participant2Code NVARCHAR(50) NOT NULL,
        lastMessage NVARCHAR(255),
        lastMessageAt DATETIME,
        createdAt DATETIME DEFAULT GETUTCDATE(),
        updatedAt DATETIME DEFAULT GETUTCDATE()
      );
    `);

    // Tabla de Mensajes - CRÍTICA para el sistema
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Messages')
      CREATE TABLE Messages (
        id NVARCHAR(50) PRIMARY KEY,
        senderId NVARCHAR(50) NOT NULL,
        senderCode NVARCHAR(50) NOT NULL,
        senderRole NVARCHAR(20) NOT NULL,
        recipientId NVARCHAR(50) NOT NULL,
        recipientCode NVARCHAR(50) NOT NULL,
        recipientRole NVARCHAR(20) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(20) DEFAULT 'UNREAD',
        messageType NVARCHAR(20) DEFAULT 'TEXT',
        attachmentUrl NVARCHAR(500),
        conversationId NVARCHAR(50) NOT NULL,
        caseId NVARCHAR(50),
        createdAt DATETIME DEFAULT GETUTCDATE(),
        readAt DATETIME NULL,
        deletedAt DATETIME NULL,
        INDEX idx_conversation (conversationId),
        INDEX idx_case (caseId),
        INDEX idx_recipient (recipientCode),
        INDEX idx_status (status),
        INDEX idx_created (createdAt)
      );
    `);

    // Tabla de Evidencias (Azure Blob Storage)
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'CaseEvidence')
      CREATE TABLE CaseEvidence (
        id NVARCHAR(50) PRIMARY KEY,
        caseId NVARCHAR(50) NOT NULL,
        blobName NVARCHAR(500) NOT NULL,
        fileName NVARCHAR(255) NOT NULL,
        contentType NVARCHAR(100),
        fileSize BIGINT,
        uploadedBy NVARCHAR(50),
        uploadedByRole NVARCHAR(20),
        createdAt DATETIME DEFAULT GETUTCDATE(),
        deletedAt DATETIME NULL,
        INDEX idx_case (caseId),
        INDEX idx_deleted (deletedAt)
      );
    `);

    console.log('✅ Tablas creadas o ya existen');
  } catch (error) {
    console.error('Error creando tablas:', error);
  }
}

// ============ ENDPOINTS DE USUARIOS ============

app.post('/api/users/register', async (req, res) => {
  try {
    const { id, encryptedCode, password, role } = req.body;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    await request
      .input('id', sql.NVarChar, id)
      .input('encryptedCode', sql.NVarChar, encryptedCode)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, role)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE id = @id)
        BEGIN
          INSERT INTO UserProfiles (id, encryptedCode, password, role)
          VALUES (@id, @encryptedCode, @password, @role)
        END
      `);

    res.json({ success: true, message: 'Usuario registrado' });
  } catch (error) {
    console.error('Error registrando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/profile/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // First check if profile columns exist
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'UserProfiles' 
        AND COLUMN_NAME IN ('psychographics', 'sociographics')
    `);
    
    const hasProfiles = columnsCheck.recordset.length === 2;
    
    // Build query based on column existence
    const selectFields = hasProfiles 
      ? 'id, encryptedCode, role, grade, psychographics, sociographics'
      : 'id, encryptedCode, role, grade';

    const request = pool.request();
    const result = await request
      .input('code', sql.NVarChar, code)
      .query(`
        SELECT ${selectFields}
        FROM UserProfiles 
        WHERE encryptedCode = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Parse JSON fields if they exist
    const user = result.recordset[0];
    if (hasProfiles) {
      if (user.psychographics) {
        try {
          user.psychographics = JSON.parse(user.psychographics);
        } catch (e) {
          user.psychographics = null;
        }
      }
      if (user.sociographics) {
        try {
          user.sociographics = JSON.parse(user.sociographics);
        } catch (e) {
          user.sociographics = null;
        }
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { code, password } = req.body;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    
    // First check if profile columns exist
    const columnsCheck = await pool.request().query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'UserProfiles' 
        AND COLUMN_NAME IN ('psychographics', 'sociographics')
    `);
    
    const hasProfiles = columnsCheck.recordset.length === 2;
    
    // Build query based on column existence
    const selectFields = hasProfiles 
      ? 'id, encryptedCode, role, grade, fullName, phone, psychographics, sociographics'
      : 'id, encryptedCode, role, grade, fullName, phone';
    
    const result = await request
      .input('code', sql.NVarChar, code.toUpperCase())
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT ${selectFields}
        FROM UserProfiles 
        WHERE UPPER(encryptedCode) = @code AND password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Parse JSON fields if they exist
    const user = result.recordset[0];
    if (hasProfiles) {
      if (user.psychographics) {
        try {
          user.psychographics = JSON.parse(user.psychographics);
        } catch (e) {
          user.psychographics = null;
        }
      }
      if (user.sociographics) {
        try {
          user.sociographics = JSON.parse(user.sociographics);
        } catch (e) {
          user.sociographics = null;
        }
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint de actualización de perfil eliminado por privacidad de datos
// Solo se almacenan en BD: código, contraseña y rol

// ============ ENDPOINTS DE CASOS ============

app.post('/api/cases/save', async (req, res) => {
  try {
    const caseData = req.body;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();

    // Verificar si el caso ya existe
    const existing = await request
      .input('id', sql.NVarChar, caseData.id)
      .query('SELECT id FROM ConflictCases WHERE id = @id');

    if (existing.recordset.length > 0) {
      // UPDATE
      const req2 = pool.request();
      await req2
        .input('id', sql.NVarChar, caseData.id)
        .input('status', sql.NVarChar, caseData.status)
        .input('summary', sql.NVarChar, caseData.summary || '')
        .input('recommendations', sql.NVarChar, JSON.stringify(caseData.recommendations || []))
        .input('messages', sql.NVarChar, JSON.stringify(caseData.messages || []))
        .input('interventions', sql.NVarChar, JSON.stringify(caseData.interventions || []))
        .input('evidence', sql.NVarChar, JSON.stringify(caseData.evidence || []))
        .query(`
          UPDATE ConflictCases 
          SET status = @status, summary = @summary, recommendations = @recommendations,
              messages = @messages, interventions = @interventions, evidence = @evidence,
              updatedAt = GETUTCDATE()
          WHERE id = @id
        `);
    } else {
      // INSERT
      const req2 = pool.request();
      await req2
        .input('id', sql.NVarChar, caseData.id)
        .input('encryptedUserCode', sql.NVarChar, caseData.encryptedUserCode)
        .input('reporterRole', sql.NVarChar, caseData.reporterRole)
        .input('status', sql.NVarChar, caseData.status)
        .input('typology', sql.NVarChar, caseData.typology)
        .input('riskLevel', sql.NVarChar, caseData.riskLevel)
        .input('summary', sql.NVarChar, caseData.summary || '')
        .input('recommendations', sql.NVarChar, JSON.stringify(caseData.recommendations || []))
        .input('assignedProtocol', sql.NVarChar, caseData.assignedProtocol || null)
        .input('assignedTo', sql.NVarChar, caseData.assignedTo || null)
        .input('messages', sql.NVarChar, JSON.stringify(caseData.messages || []))
        .input('interventions', sql.NVarChar, JSON.stringify(caseData.interventions || []))
        .input('evidence', sql.NVarChar, JSON.stringify(caseData.evidence || []))
        .query(`
          INSERT INTO ConflictCases (id, encryptedUserCode, reporterRole, status, typology, riskLevel, summary, 
                                    recommendations, assignedProtocol, assignedTo, messages, interventions, evidence)
          VALUES (@id, @encryptedUserCode, @reporterRole, @status, @typology, @riskLevel, @summary, 
                  @recommendations, @assignedProtocol, @assignedTo, @messages, @interventions, @evidence)
        `);
    }

    res.json({ success: true, caseId: caseData.id });
  } catch (error) {
    console.error('Error guardando caso:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    const result = await request.query('SELECT * FROM ConflictCases ORDER BY createdAt DESC');

    const cases = result.recordset.map(c => ({
      ...c,
      messages: JSON.parse(c.messages || '[]'),
      interventions: JSON.parse(c.interventions || '[]'),
      recommendations: JSON.parse(c.recommendations || '[]'),
      evidence: JSON.parse(c.evidence || '[]')
    }));

    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cases/user/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    const result = await request
      .input('code', sql.NVarChar, code)
      .query('SELECT * FROM ConflictCases WHERE encryptedUserCode = @code ORDER BY createdAt DESC');

    const cases = result.recordset.map(c => ({
      ...c,
      messages: JSON.parse(c.messages || '[]'),
      interventions: JSON.parse(c.interventions || '[]'),
      recommendations: JSON.parse(c.recommendations || '[]'),
      evidence: JSON.parse(c.evidence || '[]')
    }));

    res.json(cases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔧 NUEVO: GET /api/cases/messages/:userCode - Obtener casos que tienen mensajes para el usuario
app.get('/api/cases/messages/:userCode', async (req, res) => {
  try {
    const { userCode } = req.params;
    console.log('📋 [GET /api/cases/messages] Obteniendo casos para:', userCode);
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Obtener casos del usuario (como reportador)
    const casesReq = pool.request();
    const casesResult = await casesReq
      .input('code', sql.NVarChar, userCode)
      .query('SELECT * FROM ConflictCases WHERE encryptedUserCode = @code ORDER BY createdAt DESC');

    console.log(`📋 Casos encontrados: ${casesResult.recordset.length}`);

    const cases = casesResult.recordset.map(c => ({
      ...c,
      messages: JSON.parse(c.messages || '[]'),
      interventions: JSON.parse(c.interventions || '[]'),
      recommendations: JSON.parse(c.recommendations || '[]'),
      evidence: JSON.parse(c.evidence || '[]')
    }));

    res.json(cases);
  } catch (error) {
    console.error('❌ Error en /api/cases/messages:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ CHAT ENDPOINTS ============

// GET /api/chats/:userCode - Obtener todos los chats del usuario
app.get('/api/chats/:userCode', async (req, res) => {
  try {
    const { userCode } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    const result = await request
      .input('userCode', sql.NVarChar, userCode)
      .query('SELECT * FROM ChatConversations WHERE encryptedUserCode = @userCode ORDER BY updatedAt DESC');

    const chats = result.recordset.map(c => ({
      ...c,
      messages: JSON.parse(c.messages || '[]')
    }));

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chats/:chatId/messages - Obtener mensajes de un chat específico
app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    const result = await request
      .input('id', sql.NVarChar, chatId)
      .query('SELECT id, messages, topic, createdAt, updatedAt FROM ChatConversations WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = result.recordset[0];
    res.json({
      id: chat.id,
      topic: chat.topic,
      messages: JSON.parse(chat.messages || '[]'),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chats/save - Guardar un chat completo
app.post('/api/chats/save', async (req, res) => {
  try {
    const { id, encryptedUserCode, caseId, topic, messages, status } = req.body;

    console.log('📝 Intentando guardar chat:', { id, encryptedUserCode, topic });

    if (!id || !encryptedUserCode || !topic || !messages) {
      console.error('❌ Campos requeridos faltantes');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!pool) {
      console.error('❌ Pool no inicializado');
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Crear nuevo request para SELECT
    let selectRequest = pool.request();
    const existingChat = await selectRequest
      .input('id', sql.NVarChar, id)
      .query('SELECT id FROM ChatConversations WHERE id = @id');

    const now = new Date().toISOString();
    const messagesJson = JSON.stringify(messages);

    if (existingChat.recordset.length > 0) {
      console.log('📝 Actualizando chat existente:', id);
      // Actualizar chat existente - usar nuevo request
      let updateRequest = pool.request();
      await updateRequest
        .input('id', sql.NVarChar, id)
        .input('messages', sql.NVarChar, messagesJson)
        .input('status', sql.NVarChar, status || 'ACTIVE')
        .input('updatedAt', sql.DateTime, now)
        .query(`
          UPDATE ChatConversations 
          SET messages = @messages, status = @status, updatedAt = @updatedAt 
          WHERE id = @id
        `);
      console.log('✅ Chat actualizado:', id);
    } else {
      console.log('📝 Creando nuevo chat:', id);
      // Crear nuevo chat - usar nuevo request
      let insertRequest = pool.request();
      await insertRequest
        .input('id', sql.NVarChar, id)
        .input('encryptedUserCode', sql.NVarChar, encryptedUserCode)
        .input('caseId', sql.NVarChar, caseId || null)
        .input('topic', sql.NVarChar, topic)
        .input('messages', sql.NVarChar, messagesJson)
        .input('status', sql.NVarChar, status || 'ACTIVE')
        .input('createdAt', sql.DateTime, now)
        .input('updatedAt', sql.DateTime, now)
        .query(`
          INSERT INTO ChatConversations (id, encryptedUserCode, caseId, topic, messages, status, createdAt, updatedAt)
          VALUES (@id, @encryptedUserCode, @caseId, @topic, @messages, @status, @createdAt, @updatedAt)
        `);
      console.log('✅ Chat creado:', id);
    }

    res.json({ id, message: 'Chat saved successfully' });
  } catch (error) {
    console.error('❌ Error guardando chat:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/chats/:chatId/message - Agregar un mensaje a un chat existente
app.post('/api/chats/:chatId/message', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { role, content } = req.body;

    if (!role || !content) {
      return res.status(400).json({ error: 'Missing role or content' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    
    // Obtener el chat actual
    const result = await request
      .input('id', sql.NVarChar, chatId)
      .query('SELECT messages FROM ChatConversations WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = JSON.parse(result.recordset[0].messages || '[]');
    const newMessage = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);

    // Actualizar el chat con el nuevo mensaje
    const now = new Date().toISOString();
    await request
      .input('id', sql.NVarChar, chatId)
      .input('messages', sql.NVarChar, JSON.stringify(messages))
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE ChatConversations 
        SET messages = @messages, updatedAt = @updatedAt 
        WHERE id = @id
      `);

    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/chats/:chatId/archive - Archivar un chat
app.put('/api/chats/:chatId/archive', async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const request = pool.request();
    const now = new Date().toISOString();

    await request
      .input('id', sql.NVarChar, chatId)
      .input('status', sql.NVarChar, 'ARCHIVED')
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE ChatConversations 
        SET status = @status, updatedAt = @updatedAt 
        WHERE id = @id
      `);

    res.json({ message: 'Chat archived successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ MESSAGING SYSTEM ENDPOINTS ============

// POST /api/messages/send - Enviar nuevo mensaje
app.post('/api/messages/send', async (req, res) => {
  try {
    const { recipientCode, content, messageType = 'TEXT', caseId, attachmentUrl } = req.body;
    const senderCode = req.headers['x-user-code']; // Header con el código del usuario autenticado

    console.log('📨 Enviando mensaje de:', senderCode, 'a:', recipientCode);
    console.log('📨 Contenido:', content?.substring(0, 50));
    console.log('📨 Headers recibidos:', Object.keys(req.headers));

    if (!recipientCode || !content) {
      console.error('❌ Campos requeridos faltantes. RecipientCode:', recipientCode, 'Content:', !!content);
      return res.status(400).json({ error: 'Missing required fields: recipientCode, content' });
    }

    if (!senderCode) {
      console.error('❌ Falta senderCode (x-user-code header)');
      return res.status(401).json({ error: 'User not authenticated. Missing x-user-code header' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Obtener info del remitente
    let senderReq = pool.request();
    const senderUser = await senderReq
      .input('code', sql.NVarChar, senderCode)
      .query('SELECT id, encryptedCode, role FROM UserProfiles WHERE encryptedCode = @code');

    if (senderUser.recordset.length === 0) {
      return res.status(400).json({ error: 'Sender not found' });
    }

    // Obtener info del destinatario
    let recipientReq = pool.request();
    const recipientUser = await recipientReq
      .input('code', sql.NVarChar, recipientCode)
      .query('SELECT id, encryptedCode, role FROM UserProfiles WHERE encryptedCode = @code');

    if (recipientUser.recordset.length === 0) {
      return res.status(400).json({ error: 'Recipient not found' });
    }

    const sender = senderUser.recordset[0];
    const recipient = recipientUser.recordset[0];
    const messageId = `msg_${Date.now()}`;
    const now = new Date().toISOString();

    // Obtener o crear conversación
    let convReq = pool.request();
    const convResult = await convReq
      .input('p1', sql.NVarChar, senderCode)
      .input('p2', sql.NVarChar, recipientCode)
      .query(`
        SELECT id FROM Conversations 
        WHERE (participant1Code = @p1 AND participant2Code = @p2)
           OR (participant1Code = @p2 AND participant2Code = @p1)
      `);

    let conversationId;
    if (convResult.recordset.length > 0) {
      conversationId = convResult.recordset[0].id;
    } else {
      conversationId = `conv_${Date.now()}`;
      let createConvReq = pool.request();
      await createConvReq
        .input('id', sql.NVarChar, conversationId)
        .input('p1', sql.NVarChar, senderCode)
        .input('p2', sql.NVarChar, recipientCode)
        .input('createdAt', sql.DateTime, now)
        .input('updatedAt', sql.DateTime, now)
        .query(`
          INSERT INTO Conversations (id, participant1Code, participant2Code, createdAt, updatedAt)
          VALUES (@id, @p1, @p2, @createdAt, @updatedAt)
        `);
    }

    // Insertar mensaje
    let msgReq = pool.request();
    await msgReq
      .input('id', sql.NVarChar, messageId)
      .input('senderId', sql.NVarChar, sender.id)
      .input('senderCode', sql.NVarChar, sender.encryptedCode)
      .input('senderRole', sql.NVarChar, sender.role)
      .input('recipientId', sql.NVarChar, recipient.id)
      .input('recipientCode', sql.NVarChar, recipient.encryptedCode)
      .input('recipientRole', sql.NVarChar, recipient.role)
      .input('content', sql.NVarChar, content)
      .input('status', sql.NVarChar, 'UNREAD')
      .input('messageType', sql.NVarChar, messageType)
      .input('attachmentUrl', sql.NVarChar, attachmentUrl || null)
      .input('conversationId', sql.NVarChar, conversationId)
      .input('caseId', sql.NVarChar, caseId || null)
      .input('createdAt', sql.DateTime, now)
      .query(`
        INSERT INTO Messages (id, senderId, senderCode, senderRole, recipientId, recipientCode, recipientRole, content, status, messageType, attachmentUrl, conversationId, caseId, createdAt)
        VALUES (@id, @senderId, @senderCode, @senderRole, @recipientId, @recipientCode, @recipientRole, @content, @status, @messageType, @attachmentUrl, @conversationId, @caseId, @createdAt)
      `);

    // Actualizar conversación
    let updateConvReq = pool.request();
    await updateConvReq
      .input('id', sql.NVarChar, conversationId)
      .input('lastMessage', sql.NVarChar, content.substring(0, 100))
      .input('lastMessageAt', sql.DateTime, now)
      .input('updatedAt', sql.DateTime, now)
      .query(`
        UPDATE Conversations
        SET lastMessage = @lastMessage, lastMessageAt = @lastMessageAt, updatedAt = @updatedAt
        WHERE id = @id
      `);

    console.log('✅ Mensaje enviado:', messageId);
    res.json({ id: messageId, conversationId, status: 'sent', createdAt: now });
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ NUEVO ENDPOINT ============
// POST /api/messages/send-case - Enviar mensaje vinculado a un caso (para Staff)
app.post('/api/messages/send-case', async (req, res) => {
  try {
    const { caseId, recipientCode, content, messageType = 'TEXT', attachmentUrl } = req.body;
    const senderCode = req.headers['x-user-code']; // Staff enviando

    console.log('📨 [CASE] Enviando mensaje de caso:', caseId);
    console.log('📨 [CASE] Remitente:', senderCode, '→ Destinatario:', recipientCode);

    // Validaciones
    if (!caseId || !recipientCode || !content) {
      console.error('❌ [CASE] Campos requeridos faltantes');
      return res.status(400).json({ 
        error: 'Missing required fields: caseId, recipientCode, content' 
      });
    }

    if (!senderCode) {
      console.error('❌ [CASE] Falta senderCode (x-user-code header)');
      return res.status(401).json({ error: 'User not authenticated. Missing x-user-code header' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Obtener info del remitente (Staff)
    let senderReq = pool.request();
    const senderUser = await senderReq
      .input('code', sql.NVarChar, senderCode)
      .query('SELECT id, encryptedCode, role FROM UserProfiles WHERE encryptedCode = @code');

    if (senderUser.recordset.length === 0) {
      console.error('❌ [CASE] Sender (Staff) not found:', senderCode);
      return res.status(400).json({ error: 'Sender not found' });
    }

    // Obtener info del destinatario (Usuario)
    let recipientReq = pool.request();
    const recipientUser = await recipientReq
      .input('code', sql.NVarChar, recipientCode)
      .query('SELECT id, encryptedCode, role FROM UserProfiles WHERE encryptedCode = @code');

    if (recipientUser.recordset.length === 0) {
      console.error('❌ [CASE] Recipient not found:', recipientCode);
      return res.status(400).json({ error: 'Recipient not found' });
    }

    // Validar que el caso existe
    let caseReq = pool.request();
    const caseCheck = await caseReq
      .input('id', sql.NVarChar, caseId)
      .query('SELECT id FROM ConflictCases WHERE id = @id');

    if (caseCheck.recordset.length === 0) {
      console.error('❌ [CASE] Case not found:', caseId);
      return res.status(400).json({ error: 'Case not found' });
    }

    const sender = senderUser.recordset[0];
    const recipient = recipientUser.recordset[0];
    const messageId = `msg_${Date.now()}`;
    const now = new Date().toISOString();
    
    // ⭐ CRÍTICO: conversationId = caseId
    const conversationId = caseId;

    console.log('✅ [CASE] Creando mensaje con conversationId =', conversationId);

    // 🔧 NUEVO: Crear o actualizar conversación
    let convCheckReq = pool.request();
    const convCheck = await convCheckReq
      .input('id', sql.NVarChar, conversationId)
      .query('SELECT id FROM Conversations WHERE id = @id');

    if (convCheck.recordset.length === 0) {
      // Crear conversación si no existe
      let createConvReq = pool.request();
      await createConvReq
        .input('id', sql.NVarChar, conversationId)
        .input('p1', sql.NVarChar, sender.encryptedCode)
        .input('p2', sql.NVarChar, recipient.encryptedCode)
        .input('createdAt', sql.DateTime, now)
        .input('updatedAt', sql.DateTime, now)
        .query(`
          INSERT INTO Conversations (id, participant1Code, participant2Code, createdAt, updatedAt)
          VALUES (@id, @p1, @p2, @createdAt, @updatedAt)
        `);
      console.log('✅ [CASE] Conversación creada:', conversationId);
    } else {
      // Actualizar conversación existente
      let updateConvReq = pool.request();
      await updateConvReq
        .input('id', sql.NVarChar, conversationId)
        .input('lastMessage', sql.NVarChar, content.substring(0, 100))
        .input('lastMessageAt', sql.DateTime, now)
        .input('updatedAt', sql.DateTime, now)
        .query(`
          UPDATE Conversations
          SET lastMessage = @lastMessage, lastMessageAt = @lastMessageAt, updatedAt = @updatedAt
          WHERE id = @id
        `);
      console.log('✅ [CASE] Conversación actualizada:', conversationId);
    }

    // Insertar mensaje en BD
    let msgReq = pool.request();
    await msgReq
      .input('id', sql.NVarChar, messageId)
      .input('senderId', sql.NVarChar, sender.id)
      .input('senderCode', sql.NVarChar, sender.encryptedCode)
      .input('senderRole', sql.NVarChar, sender.role)
      .input('recipientId', sql.NVarChar, recipient.id)
      .input('recipientCode', sql.NVarChar, recipient.encryptedCode)
      .input('recipientRole', sql.NVarChar, recipient.role)
      .input('content', sql.NVarChar, content)
      .input('status', sql.NVarChar, 'UNREAD')
      .input('messageType', sql.NVarChar, messageType)
      .input('attachmentUrl', sql.NVarChar, attachmentUrl || null)
      .input('conversationId', sql.NVarChar, conversationId)
      .input('caseId', sql.NVarChar, caseId)
      .input('createdAt', sql.DateTime, now)
      .query(`
        INSERT INTO Messages (id, senderId, senderCode, senderRole, recipientId, recipientCode, recipientRole, content, status, messageType, attachmentUrl, conversationId, caseId, createdAt)
        VALUES (@id, @senderId, @senderCode, @senderRole, @recipientId, @recipientCode, @recipientRole, @content, @status, @messageType, @attachmentUrl, @conversationId, @caseId, @createdAt)
      `);

    console.log('✅ [CASE] Mensaje insertado en BD:', messageId);
    res.json({ 
      id: messageId, 
      conversationId: conversationId,
      caseId: caseId,
      status: 'sent', 
      createdAt: now 
    });

  } catch (error) {
    console.error('❌ [CASE] Error enviando mensaje de caso:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/inbox - Obtener bandeja de entrada
app.get('/api/messages/inbox', async (req, res) => {
  try {
    const userCode = req.headers['x-user-code'];

    if (!userCode) {
      return res.status(400).json({ error: 'User code required in header x-user-code' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    // 🔧 FIX: Traer TODOS los mensajes del usuario (enviados Y recibidos)
    const messages = await req1
      .input('code', sql.NVarChar, userCode)
      .query(`
        SELECT * FROM Messages 
        WHERE (senderCode = @code OR recipientCode = @code) AND status != 'DELETED'
        ORDER BY createdAt DESC
      `);

    console.log(`📬 Inbox de ${userCode}: ${messages.recordset.length} mensajes`);
    res.json(messages.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo inbox:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/conversation/:code - Obtener conversación con usuario específico
app.get('/api/messages/conversation/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const userCode = req.headers['x-user-code'];

    if (!userCode) {
      return res.status(400).json({ error: 'User code required in header x-user-code' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    const messages = await req1
      .input('userCode', sql.NVarChar, userCode)
      .input('otherCode', sql.NVarChar, code)
      .query(`
        SELECT * FROM Messages 
        WHERE (senderCode = @userCode AND recipientCode = @otherCode)
           OR (senderCode = @otherCode AND recipientCode = @userCode)
        ORDER BY createdAt ASC
      `);

    console.log(`💬 Conversación entre ${userCode} y ${code}: ${messages.recordset.length} mensajes`);
    res.json(messages.recordset);
  } catch (error) {
    console.error('❌ Error obteniendo conversación:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/unread-count - Contar mensajes sin leer
app.get('/api/messages/unread-count', async (req, res) => {
  try {
    const userCode = req.headers['x-user-code'];

    if (!userCode) {
      return res.status(400).json({ error: 'User code required in header x-user-code' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    const result = await req1
      .input('code', sql.NVarChar, userCode)
      .query(`
        SELECT COUNT(*) as count FROM Messages 
        WHERE recipientCode = @code AND status = 'UNREAD'
      `);

    const unreadCount = result.recordset[0].count;
    console.log(`📧 Mensajes sin leer de ${userCode}: ${unreadCount}`);
    res.json({ unreadCount });
  } catch (error) {
    console.error('❌ Error contando no leídos:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/messages/:messageId/read - Marcar como leído
app.put('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const now = new Date().toISOString();

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    await req1
      .input('id', sql.NVarChar, messageId)
      .input('status', sql.NVarChar, 'READ')
      .input('readAt', sql.DateTime, now)
      .query(`
        UPDATE Messages
        SET status = @status, readAt = @readAt
        WHERE id = @id
      `);

    console.log('✅ Mensaje marcado como leído:', messageId);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('❌ Error marcando como leído:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/messages/:messageId - Eliminar mensaje
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    await req1
      .input('id', sql.NVarChar, messageId)
      .input('status', sql.NVarChar, 'DELETED')
      .query(`
        UPDATE Messages
        SET status = @status
        WHERE id = @id
      `);

    console.log('🗑️ Mensaje eliminado:', messageId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('❌ Error eliminando mensaje:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/messages/by-case/:caseId - Mensajes relacionados a un caso
app.get('/api/messages/by-case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    let req1 = pool.request();
    const messages = await req1
      .input('caseId', sql.NVarChar, caseId)
      .query(`
        SELECT * FROM Messages 
        WHERE caseId = @caseId
        ORDER BY createdAt ASC
      `);

    console.log(`📋 [CASE] Mensajes del caso ${caseId}: ${messages.recordset.length}`);
    res.json(messages.recordset || []);
  } catch (error) {
    console.error('❌ [CASE] Error obteniendo mensajes del caso:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============ ENDPOINTS AZURE BLOB STORAGE - EVIDENCIAS ============

// POST /api/evidence/upload-url - Generar SAS token para subir evidencia
app.post('/api/evidence/upload-url', async (req, res) => {
  try {
    const { caseId, fileName, contentType, fileSize } = req.body;
    const userCode = req.headers['x-user-code'];

    console.log('🔐 Generando SAS para subir evidencia:', { caseId, fileName, userCode });

    if (!caseId || !fileName || !contentType) {
      return res.status(400).json({ error: 'Missing required fields: caseId, fileName, contentType' });
    }

    if (!userCode) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!blobServiceClient) {
      return res.status(503).json({ error: 'Azure Blob Storage not configured' });
    }

    // Validar tipo de archivo (imágenes, PDFs, documentos, videos, audios, archivos comprimidos)
    const allowedTypes = [
      // Imágenes
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      // Documentos
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Videos
      'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      // Audios
      'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac', 'audio/mp4',
      // Archivos comprimidos
      'application/zip', 'application/x-rar-compressed', 'application/vnd.rar'
    ];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: 'File type not allowed. Accepted: images, PDFs, documents, videos, audio files, ZIP and RAR archives.' });
    }

    // Validar tamaño (máx 100MB para soportar videos)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (fileSize && fileSize > maxSize) {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }

    // Generar nombre único del blob con prefijo del caso
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobName = `${caseId}/${timestamp}_${sanitizedFileName}`;

    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
    
    // Crear contenedor si no existe
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlobClient(blobName);

    // Generar SAS token con permisos de escritura (válido por 1 hora)
    const sasOptions = {
      containerName: AZURE_STORAGE_CONTAINER,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('w'), // write only
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hora
      contentType: contentType
    };

    const sasToken = generateBlobSASQueryParameters(
      sasOptions,
      new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)
    ).toString();

    const uploadUrl = `${blobClient.url}?${sasToken}`;

    console.log('✅ SAS generado para:', blobName);
    res.json({ 
      uploadUrl, 
      blobName,
      expiresIn: 3600 
    });
  } catch (error) {
    console.error('❌ Error generando SAS token:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence/register - Registrar evidencia en BD después de subir
app.post('/api/evidence/register', async (req, res) => {
  try {
    const { caseId, blobName, fileName, contentType, fileSize } = req.body;
    const userCode = req.headers['x-user-code'];

    console.log('📝 Registrando evidencia:', { caseId, blobName, userCode });

    if (!caseId || !blobName || !fileName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!userCode) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Obtener info del usuario
    let userReq = pool.request();
    const userResult = await userReq
      .input('code', sql.NVarChar, userCode)
      .query('SELECT id, role FROM UserProfiles WHERE encryptedCode = @code');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.recordset[0];
    const evidenceId = `ev_${Date.now()}`;
    const now = new Date().toISOString();

    // Insertar registro de evidencia
    let insertReq = pool.request();
    await insertReq
      .input('id', sql.NVarChar, evidenceId)
      .input('caseId', sql.NVarChar, caseId)
      .input('blobName', sql.NVarChar, blobName)
      .input('fileName', sql.NVarChar, fileName)
      .input('contentType', sql.NVarChar, contentType)
      .input('fileSize', sql.BigInt, fileSize || 0)
      .input('uploadedBy', sql.NVarChar, userCode)
      .input('uploadedByRole', sql.NVarChar, user.role)
      .input('createdAt', sql.DateTime, now)
      .query(`
        INSERT INTO CaseEvidence (id, caseId, blobName, fileName, contentType, fileSize, uploadedBy, uploadedByRole, createdAt)
        VALUES (@id, @caseId, @blobName, @fileName, @contentType, @fileSize, @uploadedBy, @uploadedByRole, @createdAt)
      `);

    console.log('✅ Evidencia registrada:', evidenceId);
    res.json({ 
      id: evidenceId,
      message: 'Evidence registered successfully' 
    });
  } catch (error) {
    console.error('❌ Error registrando evidencia:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evidence/case/:caseId - Listar evidencias de un caso
app.get('/api/evidence/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const userCode = req.headers['x-user-code'];

    console.log('📋 Listando evidencias del caso:', caseId);

    if (!userCode) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    if (!blobServiceClient) {
      return res.status(503).json({ error: 'Azure Blob Storage not configured' });
    }

    // Obtener evidencias de la BD
    let request = pool.request();
    const result = await request
      .input('caseId', sql.NVarChar, caseId)
      .query(`
        SELECT id, blobName, fileName, contentType, fileSize, uploadedBy, uploadedByRole, createdAt
        FROM CaseEvidence
        WHERE caseId = @caseId AND deletedAt IS NULL
        ORDER BY createdAt DESC
      `);

    const evidences = result.recordset;

    // Generar URLs de lectura con SAS temporal
    const evidencesWithUrls = await Promise.all(
      evidences.map(async (ev) => {
        const blobClient = blobServiceClient
          .getContainerClient(AZURE_STORAGE_CONTAINER)
          .getBlobClient(ev.blobName);

        // Generar SAS token de solo lectura (válido por 1 hora)
        const sasOptions = {
          containerName: AZURE_STORAGE_CONTAINER,
          blobName: ev.blobName,
          permissions: BlobSASPermissions.parse('r'), // read only
          startsOn: new Date(),
          expiresOn: new Date(new Date().valueOf() + 3600 * 1000)
        };

        const sasToken = generateBlobSASQueryParameters(
          sasOptions,
          new StorageSharedKeyCredential(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY)
        ).toString();

        return {
          ...ev,
          url: `${blobClient.url}?${sasToken}`,
          expiresIn: 3600
        };
      })
    );

    console.log(`✅ ${evidencesWithUrls.length} evidencias encontradas`);
    res.json(evidencesWithUrls);
  } catch (error) {
    console.error('❌ Error listando evidencias:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/evidence/:evidenceId - Eliminar evidencia (soft delete)
app.delete('/api/evidence/:evidenceId', async (req, res) => {
  try {
    const { evidenceId } = req.params;
    const userCode = req.headers['x-user-code'];

    console.log('🗑️  Eliminando evidencia:', evidenceId, 'por:', userCode);

    if (!userCode) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!pool) {
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Verificar que el usuario tenga permisos (debe ser staff/admin o el que subió)
    let userReq = pool.request();
    const userResult = await userReq
      .input('code', sql.NVarChar, userCode)
      .query('SELECT id, role FROM UserProfiles WHERE encryptedCode = @code');

    if (userResult.recordset.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.recordset[0];
    const isStaffOrAdmin = ['STAFF', 'ADMIN'].includes(user.role);

    // Obtener evidencia
    let evReq = pool.request();
    const evResult = await evReq
      .input('id', sql.NVarChar, evidenceId)
      .query('SELECT uploadedBy, blobName FROM CaseEvidence WHERE id = @id AND deletedAt IS NULL');

    if (evResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    const evidence = evResult.recordset[0];

    // Verificar permisos
    if (!isStaffOrAdmin && evidence.uploadedBy !== userCode) {
      return res.status(403).json({ error: 'Not authorized to delete this evidence' });
    }

    // Soft delete en BD
    const now = new Date().toISOString();
    let deleteReq = pool.request();
    await deleteReq
      .input('id', sql.NVarChar, evidenceId)
      .input('deletedAt', sql.DateTime, now)
      .query('UPDATE CaseEvidence SET deletedAt = @deletedAt WHERE id = @id');

    console.log('✅ Evidencia eliminada:', evidenceId);
    res.json({ message: 'Evidence deleted successfully' });
  } catch (error) {
    console.error('❌ Error eliminando evidencia:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============ SERVE STATIC FILES ============
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============ INICIAR SERVIDOR ============
initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${port}`);
  });
}).catch(err => {
  console.error('Error iniciando servidor:', err);
  process.exit(1);
});