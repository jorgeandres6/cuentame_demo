
import { UserProfile, ConflictCase, UserRole, UserNotification, ChatConversation, ChatMessage, Message } from '../types';

// API Base URL - determina si es desarrollo o producción
const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3000';
  }
  // En producción, usa la URL actual
  return window.location.origin;
};

const API_BASE = getApiBase();

// Local storage keys para datos de demostración
const USERS_KEY = 'CUENTAME_USERS';
const CASES_KEY = 'CUENTAME_CASES';
const DEMO_ACCESS_KEY = 'CUENTAME_DEMO_ACCESS'; 
const DEMO_LOGS_KEY = 'CUENTAME_DEMO_LOGS';

export interface DemoGateUser {
    id: string;
    username: string;
    password: string; 
    label: string;    
    createdAt: string;
}

export interface GateLoginLog {
    id: string;
    username: string;
    timestamp: string;
    ip: string;
}

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_001',
    fullName: 'Estudiante Demo',
    encryptedCode: 'EST-2024-A',
    password: '123',
    role: UserRole.STUDENT,
    phone: 'N/A',
    grade: '10',
    demographics: { address: 'Calle Ficticia 123' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_002',
    fullName: 'Padre Demo',
    encryptedCode: 'FAM-2024-B',
    password: '123',
    role: UserRole.PARENT,
    phone: '555-0000',
    demographics: { address: 'Avenida Siempre Viva' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_003',
    fullName: 'Profesor Demo',
    encryptedCode: 'DOC-2024-C',
    password: '123',
    role: UserRole.TEACHER,
    phone: 'N/A',
    demographics: {},
    psychographics: {
        interests: [],
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_admin',
    fullName: 'Director General',
    encryptedCode: 'ADM-MASTER',
    password: 'admin',
    role: UserRole.ADMIN,
    phone: 'N/A',
    demographics: {},
    notifications: []
  },
  {
    id: 'usr_staff',
    fullName: 'Psicóloga Escolar',
    encryptedCode: 'STAFF-PSI',
    password: 'staff',
    role: UserRole.STAFF,
    phone: 'N/A',
    demographics: {},
    notifications: []
  }
];

const initializeData = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
};

initializeData();

export const getSystemGateUsers = (): DemoGateUser[] => {
    const data = localStorage.getItem(DEMO_ACCESS_KEY);
    return data ? JSON.parse(data) : [];
};

export const registerSystemGateUser = (username: string, pass: string, label: string): DemoGateUser => {
    const users = getSystemGateUsers();
    const newUser: DemoGateUser = {
        id: Date.now().toString(),
        username,
        password: pass,
        label,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(DEMO_ACCESS_KEY, JSON.stringify(users));
    return newUser;
};

export const verifySystemGateCredentials = (user: string, pass: string): boolean => {
    if (user === 'cuentame2026' && pass === 'Cu3nt@m3') {
        return true;
    }
    const gateUsers = getSystemGateUsers();
    return gateUsers.some(u => u.username === user && u.password === pass);
};

export const getGateLoginLogs = (): GateLoginLog[] => {
    const data = localStorage.getItem(DEMO_LOGS_KEY);
    return data ? JSON.parse(data) : [];
};

export const recordGateLogin = async (username: string): Promise<void> => {
    let ip = 'IP Privada / Desconocida';
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            ip = data.ip;
        }
    } catch (error) {}

    const logs = getGateLoginLogs();
    const newLog: GateLoginLog = {
        id: Date.now().toString(),
        username,
        timestamp: new Date().toISOString(),
        ip
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.length = 50;
    localStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
};

export const generateEncryptedCode = (userId: string): string => {
  return `ENC-${userId.substring(0, 4)}-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  // Los datos personales no se guardan en la BD por privacidad
  // Solo se almacenan: código, contraseña y rol
  console.log('Perfil de usuario (solo en memoria):', profile.encryptedCode, profile.role);
};

export const registerNewUser = async (fullName: string, role: UserRole, password: string, grade?: string): Promise<UserProfile> => {
    const prefixMap = {
        [UserRole.STUDENT]: 'EST',
        [UserRole.PARENT]: 'FAM',
        [UserRole.TEACHER]: 'DOC',
        [UserRole.STAFF]: 'STAFF',
        [UserRole.ADMIN]: 'ADM'
    };
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefixMap[role]}-2026-${randomSuffix}`;
    
    const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        fullName,
        encryptedCode: code,
        password,
        role,
        grade,
        phone: 'N/A',
        demographics: {},
        notifications: [],
        psychographics: {
            interests: [], 
            personalityTraits: [],
            values: [],
            motivations: [],
            lifestyle: []
        }
    };

    try {
        await fetch(`${API_BASE}/api/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: newUser.id,
                encryptedCode: newUser.encryptedCode,
                password: newUser.password,
                role: newUser.role
            })
        });
    } catch (error) {
        console.error('Error registrando usuario:', error);
    }
    
    return newUser;
};

export const getUserProfileByCode = async (encryptedCode: string): Promise<UserProfile | undefined> => {
  try {
    const response = await fetch(`${API_BASE}/api/users/profile/${encryptedCode}`);
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return undefined;
  }
};

export const loginUserByCredentials = async (code: string, password: string): Promise<UserProfile | undefined> => {
  try {
    const response = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, password })
    });
    
    if (!response.ok) return undefined;
    return await response.json();
  } catch (error) {
    console.error('Error login:', error);
    return undefined;
  }
};

export const addNotificationToUser = async (
    encryptedCode: string, 
    title: string, 
    message: string,
    type: 'INFO' | 'REQUEST' = 'INFO',
    relatedCaseId?: string
): Promise<void> => {
    // Notificaciones se almacenan en memoria local (no en BD por privacidad)
    try {
        const newNotification: UserNotification = {
            id: Date.now().toString(),
            title,
            message,
            date: new Date().toISOString(),
            read: false,
            type,
            relatedCaseId
        };
        console.log('Notificación creada (memoria local):', newNotification);
    } catch (error) {
        console.error('Error añadiendo notificación:', error);
    }
};

export const replyToNotification = async (encryptedCode: string, notificationId: string, replyText: string): Promise<UserProfile | null> => {
    // Las respuestas se almacenan en memoria local (no en BD por privacidad)
    try {
        console.log('Respuesta a notificación (memoria local):', { encryptedCode, notificationId, replyText });
    } catch (error) {
        console.error('Error respondiendo notificación:', error);
    }
    return null;
};

export const saveCase = async (conflictCase: ConflictCase): Promise<void> => {
    try {
        await fetch(`${API_BASE}/api/cases/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conflictCase)
        });
    } catch (error) {
        console.error('Error guardando caso:', error);
    }
};

export const getCases = async (): Promise<ConflictCase[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/cases`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error al obtener casos:", error);
    return [];
  }
};

export const getCaseByCode = async (code: string): Promise<ConflictCase | undefined> => {
  const cases = await getCases();
  return cases.find(c => c.encryptedUserCode === code);
};

export const getCasesByUserCode = async (code: string): Promise<ConflictCase[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/cases/user/${code}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error al obtener casos del usuario:", error);
    return [];
  }
};

// ============ CHAT FUNCTIONS ============

export const saveChat = async (chat: ChatConversation): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/chats/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chat)
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error guardando chat:', error);
    return false;
  }
};

export const getChats = async (userCode: string): Promise<ChatConversation[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/chats/${userCode}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const chats = await response.json();
    return Array.isArray(chats) ? chats : [];
  } catch (error) {
    console.error('Error obteniendo chats:', error);
    return [];
  }
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${API_BASE}/api/chats/${chatId}/messages`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error obteniendo mensajes del chat:', error);
    return [];
  }
};

export const addMessageToChat = async (chatId: string, message: ChatMessage): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/chats/${chatId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: message.role,
        content: message.content
      })
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error agregando mensaje al chat:', error);
    return false;
  }
};

export const archiveChat = async (chatId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/chats/${chatId}/archive`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error archivando chat:', error);
    return false;
  }
};

export const createNewChat = (userCode: string, topic: string, caseId?: string): ChatConversation => {
  return {
    id: `chat_${Date.now()}`,
    encryptedUserCode: userCode,
    caseId,
    topic,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'ACTIVE'
  };
};
// ============ MESSAGING FUNCTIONS ============

export const sendMessage = async (
  recipientCode: string,
  content: string,
  userCode: string,
  messageType: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT' = 'TEXT',
  caseId?: string,
  attachmentUrl?: string
): Promise<{ id: string; conversationId: string } | null> => {
  try {
    // 🔧 TIMEOUT: 10 segundos para Azure SQL
    const response = await fetch(`${API_BASE}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-code': userCode
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        recipientCode,
        content,
        messageType,
        caseId,
        attachmentUrl
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Error enviando mensaje al servidor, guardando en localStorage:', error);
    // 🔧 FALLBACK: Guardar en localStorage
    return saveMessageToLocalStorage(recipientCode, content, userCode, messageType, caseId, attachmentUrl);
  }
};

// 🔧 NUEVO: Guardar mensaje en localStorage como fallback
const saveMessageToLocalStorage = (
  recipientCode: string,
  content: string,
  userCode: string,
  messageType: string,
  caseId?: string,
  attachmentUrl?: string
): { id: string; conversationId: string } | null => {
  try {
    const allMessages = localStorage.getItem('CUENTAME_MESSAGES') || '[]';
    const messages: Message[] = JSON.parse(allMessages);
    
    // 🔧 NUEVO: También guardar en CONVERSATIONS
    const conversations = JSON.parse(localStorage.getItem('CUENTAME_CONVERSATIONS') || '[]');
    
    const messageId = `msg_${Date.now()}`;
    const conversationId = caseId || `conv_${userCode}_${recipientCode}`;
    const now = new Date().toISOString();
    
    const newMessage: Message = {
      id: messageId,
      senderId: 'user-id',
      senderCode: userCode,
      senderRole: 'STUDENT',
      recipientId: 'recipient-id',
      recipientCode,
      recipientRole: 'STAFF',
      content,
      status: 'UNREAD',
      messageType: messageType as any,
      conversationId,
      caseId: caseId || null,
      createdAt: now
    };
    
    messages.push(newMessage);
    
    // Crear o actualizar conversación
    const existingConv = conversations.find((c: any) => c.id === conversationId);
    if (!existingConv) {
      conversations.push({
        id: conversationId,
        participant1Code: userCode,
        participant2Code: recipientCode,
        lastMessage: content.substring(0, 100),
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now
      });
    } else {
      existingConv.lastMessage = content.substring(0, 100);
      existingConv.lastMessageAt = now;
      existingConv.updatedAt = now;
    }
    
    localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(messages));
    localStorage.setItem('CUENTAME_CONVERSATIONS', JSON.stringify(conversations));
    console.log('✅ Mensaje y conversación guardados en localStorage:', messageId);
    
    return { id: messageId, conversationId };
  } catch (error) {
    console.error('Error guardando mensaje en localStorage:', error);
    return null;
  }
};
export const getInbox = async (userCode: string): Promise<Message[]> => {
  try {
    // 🔧 TIMEOUT: 10 segundos para Azure SQL (latencia de red + pool connection)
    // Antes era 3000ms que es muy corto para conectar a Azure desde otras regiones
    const response = await fetch(`${API_BASE}/api/messages/inbox`, {
      headers: {
        'x-user-code': userCode
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    // Log más detallado del tipo de error para debugging
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.warn(`⚠️ Error obteniendo inbox del servidor (${errorName}), intentando localStorage:`, errorMsg);
    // 🔧 FALLBACK: Obtener del localStorage para desarrollo sin BD
    return getInboxFromLocalStorage(userCode);
  }
};

// 🔧 NUEVO: Fallback para cuando no hay BD
const getInboxFromLocalStorage = (userCode: string): Message[] => {
  try {
    const allMessages = localStorage.getItem('CUENTAME_MESSAGES') || '[]';
    const messages: Message[] = JSON.parse(allMessages);
    // 🔧 FIX: Traer todos los mensajes de conversaciones del usuario (enviados Y recibidos)
    // Tanto si es senderCode como recipientCode
    return messages.filter(m => m.senderCode === userCode || m.recipientCode === userCode);
  } catch (error) {
    console.warn('Error obteniendo inbox de localStorage:', error);
    return [];
  }
};

export const getConversation = async (userCode: string, otherCode: string): Promise<Message[]> => {
  try {
    // 🔧 TIMEOUT: 10 segundos para Azure SQL
    const response = await fetch(`${API_BASE}/api/messages/conversation/${otherCode}`, {
      headers: {
        'x-user-code': userCode
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    console.warn(`⚠️ Error obteniendo conversación (${errorName}), intentando localStorage:`, errorMsg);
    // 🔧 FALLBACK: Intentar localStorage
    return getConversationFromLocalStorage(userCode, otherCode);
  }
};

export const getUnreadCount = async (userCode: string): Promise<number> => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/unread-count`, {
      headers: {
        'x-user-code': userCode
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.unreadCount || 0;
  } catch (error) {
    console.error('Error obteniendo conteo no leído:', error);
    return 0;
  }
};

export const markAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/${messageId}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error marcando como leído:', error);
    return false;
  }
};

export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    return false;
  }
};

export const getMessagesByCase = async (caseId: string): Promise<Message[]> => {
  try {
    // 🔧 TIMEOUT: 10 segundos para Azure SQL
    const response = await fetch(`${API_BASE}/api/messages/by-case/${caseId}`, {
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Error obteniendo mensajes del caso del servidor, intentando localStorage:', error);
    // 🔧 FALLBACK: Obtener del localStorage
    return getMessagesByCaseFromLocalStorage(caseId);
  }
};

// 🔧 NUEVO: Fallback para cuando no hay BD
const getMessagesByCaseFromLocalStorage = (caseId: string): Message[] => {
  try {
    const allMessages = localStorage.getItem('CUENTAME_MESSAGES') || '[]';
    const messages: Message[] = JSON.parse(allMessages);
    // Filtrar solo mensajes del caso
    return messages.filter(m => m.caseId === caseId);
  } catch (error) {
    console.warn('Error obteniendo mensajes del localStorage:', error);
    return [];
  }
};

// ============ MESSAGING WITH CASE INTEGRATION ============

/**
 * Envía un mensaje vinculado a un caso específico.
 * STAFF: Envía desde CaseDetail
 * USUARIOS: Envían desde MessagingInterface con caseId
 * 
 * @param caseId - ID del caso (será conversationId)
 * @param recipientCode - Código del destinatario
 * @param content - Contenido del mensaje
 * @param userCode - Código del remitente
 * @param messageType - Tipo de mensaje (TEXT, FILE, MEDIA, ALERT)
 * @param attachmentUrl - URL del adjunto (opcional)
 * @returns Promise con id y conversationId del mensaje
 */
export const sendMessageWithCase = async (
  caseId: string,
  recipientCode: string,
  content: string,
  userCode: string,
  messageType: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT' = 'TEXT',
  attachmentUrl?: string
): Promise<{ id: string; conversationId: string } | null> => {
  try {
    // 🔧 TIMEOUT: 10 segundos para Azure SQL
    const response = await fetch(`${API_BASE}/api/messages/send-case`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-code': userCode
      },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        caseId,           // ← conversationId = caseId
        recipientCode,
        content,
        messageType,
        attachmentUrl
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Error enviando mensaje del caso al servidor, guardando en localStorage:', error);
    // 🔧 FALLBACK: Guardar en localStorage
    return saveMessageToLocalStorage(recipientCode, content, userCode, messageType, caseId, attachmentUrl);
  }
};

/**
 * Obtiene conversación específica entre dos usuarios en un caso.
 * Filtra mensajes por caseId para mayor precisión.
 * 
 * @param userCode - Código del usuario actual
 * @param otherCode - Código del otro participante
 * @param caseId - ID del caso para filtrar
 * @returns Promise con array de mensajes de esa conversación en ese caso
 */
export const getConversationByCase = async (
  userCode: string,
  otherCode: string,
  caseId: string
): Promise<Message[]> => {
  try {
    const response = await fetch(
      `${API_BASE}/api/messages/conversation/${otherCode}?caseId=${caseId}`,
      {
        headers: {
          'x-user-code': userCode
        }
      }
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo conversación del caso:', error);
    return [];
  }
};

/**
 * Agrupa mensajes por caseId para organizar el inbox.
 * Útil en MessagingInterface para mostrar casos por separado.
 * 
 * @param messages - Array de mensajes del inbox
 * @returns Objeto con caseId como clave y array de mensajes como valor
 */
export const groupMessagesByCase = (
  messages: Message[]
): { [caseId: string]: Message[] } => {
  return messages.reduce((groups, message) => {
    const caseId = message.caseId || message.conversationId || 'sin-caso';
    if (!groups[caseId]) {
      groups[caseId] = [];
    }
    groups[caseId].push(message);
    return groups;
  }, {} as { [caseId: string]: Message[] });
};

/**
 * Obtiene el último mensaje de cada caso para mostrar en listados.
 * Útil para ver un resumen rápido en MessagingInterface.
 * 
 * @param messages - Array de mensajes del inbox
 * @returns Array con el último mensaje de cada caso
 */
export const getLastMessageByCase = (messages: Message[]): Message[] => {
  const grouped = groupMessagesByCase(messages);
  return Object.values(grouped).map(caseMessages =>
    caseMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  );
};

/**
 * 🔧 NUEVO: Obtiene casos del usuario junto con sus mensajes
 * MEJORADO: Ahora obtiene casos donde el usuario ha recibido mensajes, no solo donde es reportador.
 * Esta función obtiene primero los casos con mensajes para el usuario, luego para cada caso
 * obtiene los mensajes asociados. Esto asegura que se muestren todos los casos
 * incluso si el usuario no es el reportador original.
 * 
 * @param userCode - Código del usuario
 * @returns Array de casos agrupados con sus mensajes
 */
export const getUserCasesWithMessages = async (userCode: string): Promise<{ [caseId: string]: { caseInfo: any; messages: Message[] } }> => {
  try {
    console.log('🔍 [getUserCasesWithMessages] Obteniendo casos para:', userCode);
    
    // 🔧 MEJORADO: Usar endpoint que obtiene casos con mensajes
    const casesResponse = await fetch(`${API_BASE}/api/cases/messages/${userCode}`, {
      signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
    });
    
    if (!casesResponse.ok) {
      console.warn('⚠️ [getUserCasesWithMessages] No se pudieron obtener casos. Status:', casesResponse.status);
      return {};
    }

    const cases = await casesResponse.json();
    console.log('📋 [getUserCasesWithMessages] Casos obtenidos:', cases.length);
    
    const casesWithMessages: { [caseId: string]: { caseInfo: any; messages: Message[] } } = {};

    // Para cada caso, obtener sus mensajes
    for (const caseInfo of cases) {
      try {
        console.log(`📨 [getUserCasesWithMessages] Obteniendo mensajes para caso: ${caseInfo.id}`);
        const messages = await getMessagesByCase(caseInfo.id);
        console.log(`✅ [getUserCasesWithMessages] Caso ${caseInfo.id} tiene ${messages.length} mensajes`);
        casesWithMessages[caseInfo.id] = { caseInfo, messages };
      } catch (error) {
        console.warn(`❌ [getUserCasesWithMessages] Error para caso ${caseInfo.id}:`, error);
        casesWithMessages[caseInfo.id] = { caseInfo, messages: [] };
      }
    }

    console.log('✅ [getUserCasesWithMessages] Total casos con mensajes:', Object.keys(casesWithMessages).length);
    return casesWithMessages;
  } catch (error) {
    console.error('❌ [getUserCasesWithMessages] Error general:', error);
    console.log('⚠️ [getUserCasesWithMessages] Retornando objeto vacío (fallback)');
    return {};
  }
};