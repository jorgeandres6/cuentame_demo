# 💬 Guía de Almacenamiento de Chats - CUÉNTAME

## Overview
Cada conversación completa se almacena automáticamente en Azure SQL Database. Los chats pueden asociarse a casos específicos y recuperarse en cualquier momento.

## 🗄️ Estructura de Datos

### ChatConversation (Tabla en BD)
```typescript
{
  id: string;                    // ID único (chat_TIMESTAMP)
  encryptedUserCode: string;     // Quién participa (sin datos personales)
  caseId?: string;               // ID del caso asociado (opcional)
  topic: string;                 // Tema del chat (ej: "Reporte de Conflicto")
  messages: ChatMessage[];       // Array de todos los mensajes
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  status: 'ACTIVE' | 'ARCHIVED'; // Estado del chat
}
```

### ChatMessage
```typescript
{
  id: string;            // msg_TIMESTAMP
  role: 'user' | 'assistant';  // Quién envía
  content: string;       // Contenido del mensaje
  timestamp: string;     // ISO date
}
```

## 🔌 API Endpoints

### 1. Guardar/Actualizar Chat Completo
```bash
POST /api/chats/save
Content-Type: application/json

{
  "id": "chat_1234567890",
  "encryptedUserCode": "EST-2024-A",
  "caseId": "CAS-1234567890",
  "topic": "Reporte de Conflicto",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "Hola, necesito reportar un conflicto",
      "timestamp": "2026-01-19T10:30:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Te escucho, cuéntame qué pasó",
      "timestamp": "2026-01-19T10:30:05Z"
    }
  ],
  "status": "ACTIVE"
}
```

### 2. Obtener Todos los Chats de un Usuario
```bash
GET /api/chats/:encryptedUserCode
Content-Type: application/json
```

**Respuesta:**
```json
[
  {
    "id": "chat_1234567890",
    "encryptedUserCode": "EST-2024-A",
    "caseId": "CAS-1234567890",
    "topic": "Reporte de Conflicto",
    "messages": [...],
    "createdAt": "2026-01-19T10:30:00Z",
    "updatedAt": "2026-01-19T10:45:00Z",
    "status": "ARCHIVED"
  }
]
```

### 3. Obtener Mensajes de un Chat Específico
```bash
GET /api/chats/:chatId/messages
Content-Type: application/json
```

**Respuesta:**
```json
{
  "id": "chat_1234567890",
  "topic": "Reporte de Conflicto",
  "messages": [
    { "id": "msg_1", "role": "user", "content": "...", "timestamp": "..." },
    { "id": "msg_2", "role": "assistant", "content": "...", "timestamp": "..." }
  ],
  "createdAt": "2026-01-19T10:30:00Z",
  "updatedAt": "2026-01-19T10:45:00Z"
}
```

### 4. Agregar Mensaje a un Chat
```bash
POST /api/chats/:chatId/message
Content-Type: application/json

{
  "role": "user",
  "content": "Este es un nuevo mensaje"
}
```

**Respuesta:**
```json
{
  "id": "msg_12345",
  "role": "user",
  "content": "Este es un nuevo mensaje",
  "timestamp": "2026-01-19T10:45:30Z"
}
```

### 5. Archivar un Chat
```bash
PUT /api/chats/:chatId/archive
Content-Type: application/json
```

**Respuesta:**
```json
{
  "message": "Chat archived successfully"
}
```

## 📋 Funciones de Storage Service

### 1. `saveChat(chat: ChatConversation): Promise<boolean>`
Guarda o actualiza un chat completo en la BD.

```typescript
import { saveChat, createNewChat } from './services/storageService';

const newChat = createNewChat('EST-2024-A', 'Reporte de Conflicto');
const success = await saveChat(newChat);
```

### 2. `getChats(userCode: string): Promise<ChatConversation[]>`
Obtiene todos los chats de un usuario.

```typescript
import { getChats } from './services/storageService';

const userChats = await getChats('EST-2024-A');
console.log(`El usuario tiene ${userChats.length} chats`);
```

### 3. `getChatMessages(chatId: string): Promise<ChatMessage[]>`
Obtiene los mensajes de un chat específico.

```typescript
import { getChatMessages } from './services/storageService';

const messages = await getChatMessages('chat_1234567890');
```

### 4. `addMessageToChat(chatId: string, message: ChatMessage): Promise<boolean>`
Agrega un mensaje a un chat existente.

```typescript
import { addMessageToChat } from './services/storageService';

const message: ChatMessage = {
  id: `msg_${Date.now()}`,
  role: 'user',
  content: 'Mi nuevo mensaje',
  timestamp: new Date().toISOString()
};

await addMessageToChat('chat_1234567890', message);
```

### 5. `archiveChat(chatId: string): Promise<boolean>`
Archiva un chat (marca como completado).

```typescript
import { archiveChat } from './services/storageService';

await archiveChat('chat_1234567890');
```

### 6. `createNewChat(userCode: string, topic: string, caseId?: string): ChatConversation`
Crea un nuevo objeto de chat (sin guardar en BD).

```typescript
import { createNewChat } from './services/storageService';

const newChat = createNewChat('EST-2024-A', 'Consulta General');
// Luego guardarlo:
await saveChat(newChat);
```

## ⚙️ Flujo Automático en ChatInterface

1. **Inicio de Sesión:**
   - Se crea un chat nuevo automáticamente
   - ID se guarda en localStorage

2. **Durante la Conversación:**
   - Cada nuevo mensaje se agrega al array
   - `useEffect` detecta cambios en los mensajes
   - Chat se sincroniza automáticamente con la BD cada 5 segundos aproximadamente

3. **Finalización del Reporte:**
   - Se clasifica el caso con Gemini
   - Se crea un `ConflictCase` nuevo
   - Se guarda el chat completo marcado como `ARCHIVED`
   - Se asocia el `caseId` al chat
   - localStorage se limpia

## 🔐 Privacidad

- Solo se almacena `encryptedUserCode` (sin nombres, teléfonos, ni emails)
- Los chats se asocian a usuarios únicamente por código encriptado
- No se persisten notificaciones personales
- Cumple con GDPR/Privacidad de Datos

## 📊 Ejemplo Completo: Guardar Chat Manual

```typescript
import { 
  createNewChat, 
  saveChat, 
  addMessageToChat,
  archiveChat 
} from './services/storageService';

// 1. Crear nuevo chat
const chat = createNewChat('EST-2024-A', 'Consulta de Seguridad');

// 2. Guardar chat vacío
await saveChat(chat);

// 3. Agregar primer mensaje
const userMsg = {
  id: `msg_${Date.now()}`,
  role: 'user' as const,
  content: '¿Qué debo hacer si siento amenazado?',
  timestamp: new Date().toISOString()
};
await addMessageToChat(chat.id, userMsg);

// 4. Agregar respuesta
const aiMsg = {
  id: `msg_${Date.now() + 1}`,
  role: 'assistant' as const,
  content: 'Te recomiendo que hables con un adulto de confianza...',
  timestamp: new Date().toISOString()
};
await addMessageToChat(chat.id, aiMsg);

// 5. Cuando termina la conversación, archivar
await archiveChat(chat.id);
```

## 🧪 Testing en Local

```bash
# Iniciar servidor
npm run dev:server

# Crear un chat (en terminal o Postman)
curl -X POST http://localhost:3000/api/chats/save \
  -H "Content-Type: application/json" \
  -d '{
    "id": "chat_test_123",
    "encryptedUserCode": "EST-2024-A",
    "topic": "Test de Chat",
    "messages": [
      {
        "id": "msg_1",
        "role": "user",
        "content": "Mensaje de prueba",
        "timestamp": "'$(date -u +'%Y-%m-%dT%H:%M:%SZ')'‌"
      }
    ],
    "status": "ACTIVE"
  }'

# Obtener chats del usuario
curl http://localhost:3000/api/chats/EST-2024-A

# Agregar mensaje
curl -X POST http://localhost:3000/api/chats/chat_test_123/message \
  -H "Content-Type: application/json" \
  -d '{"role":"assistant","content":"Respuesta de prueba"}'

# Archivar
curl -X PUT http://localhost:3000/api/chats/chat_test_123/archive
```

## ✅ Checklist de Integración

- [x] Nueva tabla `ChatConversations` en Azure SQL
- [x] 5 endpoints API implementados (GET chats, GET messages, POST save, POST message, PUT archive)
- [x] Funciones de storage en `storageService.ts`
- [x] Tipos en `types.ts`
- [x] Integración automática en `ChatInterface.tsx`
- [x] Persistencia automática de chats durante conversación
- [x] Asociación chat ↔ caso al finalizar reporte
- [x] Cumplimiento de privacidad (solo encryptedCode)

## 📞 Soporte

Si encuentras errores de persistencia:
1. Verificar que la BD está conectada: `GET /api/health`
2. Revisar que `encryptedUserCode` existe en `UserProfiles`
3. Verificar los logs del servidor: `npm run dev:server`
4. Confirmar que `.env.local` tiene credenciales correctas
