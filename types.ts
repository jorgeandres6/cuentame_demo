
// Enums
export enum UserRole {
  STUDENT = 'STUDENT', // Cliente Externo
  PARENT = 'PARENT',   // Cliente Externo
  TEACHER = 'TEACHER', // Cliente Externo (Docente que reporta)
  STAFF = 'STAFF',     // Cliente Interno (Gestor, Psicólogo)
  ADMIN = 'ADMIN'      // Súper Administrador
}

export enum CaseStatus {
  OPEN = 'ABIERTO',
  IN_PROGRESS = 'EN_PROCESO',
  RESOLVED = 'RESUELTO',
  CLOSED = 'CERRADO'
}

export enum RiskLevel {
  LOW = 'BAJO',
  MEDIUM = 'MEDIO',
  HIGH = 'ALTO',
  CRITICAL = 'CRÍTICO'
}

export enum InterventionType {
  TUTORING = 'TUTORÍA',
  PSYCHOLOGY = 'PSICOLOGÍA',
  DIRECTION = 'DIRECCIÓN',
  EXTERNAL = 'AUTORIDADES_EXTERNAS'
}

// Data Models

export interface PsychographicProfile {
  interests: string[];       // Hobbies, gustos
  values: string[];          // Qué valoran (justicia, lealtad, honestidad)
  motivations: string[];     // Metas, qué los mueve
  lifestyle: string[];       // Rutinas, entorno social
  personalityTraits: string[]; // Introvertido, ansioso, líder
}

export interface SociographicProfile {
  educationLevel?: string;     // Nivel educativo (Primaria, Secundaria, Superior)
  schoolName?: string;         // Nombre del colegio o institución educativa
  schoolType?: string;         // Tipo de colegio (Público, Privado, Fiscomisional)
  familyStructure?: string;    // Estructura familiar (Nuclear, Monoparental, Extendida)
  socioeconomicStatus?: string; // Nivel socioeconómico (Bajo, Medio, Alto)
  geographicLocation?: string; // Ubicación geográfica (Urbano, Rural)
  culturalBackground?: string; // Antecedentes culturales o étnicos
  religion?: string;           // Afiliación religiosa
  occupationStatus?: string;   // Estado ocupacional (Estudiante, Empleado, Desempleado)
  householdSize?: number;      // Tamaño del hogar
  socialSupport?: string;      // Redes de apoyo social (Fuerte, Moderado, Débil)
  livingConditions?: string;   // Condiciones de vivienda
}

export interface UserNotification {
  id: string;
  title: string;
  content: string;
  message?: string; // Backward compatibility
  date?: string;    // Backward compatibility
  timestamp: Date;
  read: boolean;
  type?: 'alert' | 'message';
  caseId?: string;           // Para agrupar mensajes por caso
  senderCode: string;        // Código del que envía el mensaje
  senderName?: string;       // Nombre del remitente
  actionUrl?: string;        // URL de acción si la hay
  reply?: string;            // La respuesta del usuario
  replyDate?: string;        // Fecha de la respuesta
}

// Repositorio 1: Perfil de Usuario (Acceso Restringido)
export interface UserProfile {
  id: string; // Internal DB ID
  fullName: string; 
  email?: string; 
  password: string; // Contraseña preasignada
  phone: string;
  role: UserRole;
  grade?: string; // Solo educandos
  age?: number;
  encryptedCode: string; // The link to the Case Repository AND Login Username
  demographics: {
    address?: string;
    guardianName?: string;
  };
  psychographics?: PsychographicProfile; // Perfil psicográfico (intereses, valores, motivaciones)
  sociographics?: SociographicProfile;   // Perfil sociográfico (educación, familia, contexto social)
  notifications: UserNotification[]; // Mensajes del sistema al usuario
}

export interface CaseEvidence {
  id: string;
  name: string;
  mimeType: string;
  data: string; // base64
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant'; // Quién envía el mensaje
  content: string; // Contenido del mensaje
  timestamp: string; // ISO date string
}

export interface ChatConversation {
  id: string; // ID único del chat
  encryptedUserCode: string; // Quién participa en el chat
  caseId?: string; // Si está asociado a un caso específico
  topic: string; // Tema del chat (ej: "Conflicto en clase", "Consulta general")
  messages: ChatMessage[]; // Array de todos los mensajes
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: 'ACTIVE' | 'ARCHIVED'; // Si está activo o archivado
}

// ============ MESSAGING SYSTEM ============

export interface Message {
  id: string;
  senderId: string;
  senderCode: string;
  senderRole: UserRole;
  recipientId: string;
  recipientCode: string;
  recipientRole: UserRole;
  content: string;
  status: 'UNREAD' | 'READ' | 'DELETED';
  messageType: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT';
  attachmentUrl?: string;
  conversationId: string;
  caseId?: string;
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participant1Code: string;
  participant2Code: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Repositorio 2: Casos (Acceso Amplio / Anonimizado)
export interface ConflictCase {
  id: string;
  encryptedUserCode: string; // Link to UserProfile
  reporterRole: UserRole; // Rol del usuario que reportó (Estudiante, Padre, Docente)
  createdAt: string;
  updatedAt: string;
  status: CaseStatus;
  
  // AI Classification
  typology: string;
  riskLevel: RiskLevel;
  summary: string;
  recommendations?: string[]; // Nuevas recomendaciones para el staff
  
  // Workflow
  assignedProtocol: InterventionType;
  assignedTo: string; // Role or Dept name
  
  // History
  messages: ChatMessage[];
  interventions: InterventionRecord[];
  evidence?: CaseEvidence[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface InterventionRecord {
  id: string;
  date: string;
  actionTaken: string;
  responsible: string;
  outcome?: string;
}

export interface AIClassificationResult {
  typology: string;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[]; // Lista de acciones sugeridas
  psychographics: PsychographicProfile;
}
