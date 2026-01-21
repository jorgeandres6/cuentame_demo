# 📨 Sistema de Mensajería - Guía de Implementación

## 1. Script SQL para crear tabla de mensajes

Ejecuta en **Azure Portal → Query Editor**:

```sql
-- Crear tabla de mensajes directos entre usuarios
CREATE TABLE Messages (
    id NVARCHAR(50) PRIMARY KEY,
    senderId NVARCHAR(50) NOT NULL,
    senderCode NVARCHAR(50) NOT NULL,
    senderRole NVARCHAR(20) NOT NULL,
    recipientId NVARCHAR(50) NOT NULL,
    recipientCode NVARCHAR(50) NOT NULL,
    recipientRole NVARCHAR(20) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) DEFAULT 'UNREAD',  -- UNREAD, READ, DELETED
    messageType NVARCHAR(50) DEFAULT 'TEXT',  -- TEXT, FILE, MEDIA, ALERT
    attachmentUrl NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETUTCDATE(),
    readAt DATETIME,
    conversationId NVARCHAR(50),
    caseId NVARCHAR(50),
    FOREIGN KEY (senderId) REFERENCES UserProfiles(id),
    FOREIGN KEY (recipientId) REFERENCES UserProfiles(id)
);

-- Crear tabla de conversaciones (grupos de mensajes entre usuarios)
CREATE TABLE Conversations (
    id NVARCHAR(50) PRIMARY KEY,
    participant1Code NVARCHAR(50) NOT NULL,
    participant2Code NVARCHAR(50) NOT NULL,
    lastMessage NVARCHAR(MAX),
    lastMessageAt DATETIME,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    FOREIGN KEY (participant1Code) REFERENCES UserProfiles(encryptedCode),
    FOREIGN KEY (participant2Code) REFERENCES UserProfiles(encryptedCode)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_senderCode ON Messages(senderCode);
CREATE INDEX idx_recipientCode ON Messages(recipientCode);
CREATE INDEX idx_conversationId ON Messages(conversationId);
CREATE INDEX idx_messageStatus ON Messages(status);
CREATE INDEX idx_messageCreatedAt ON Messages(createdAt);
CREATE INDEX idx_conversationParticipants ON Conversations(participant1Code, participant2Code);
CREATE INDEX idx_conversationLastMessage ON Conversations(lastMessageAt DESC);
```

## 2. Flujo de Comunicación

### Usuario Envía Mensaje
```
Cliente → POST /api/messages/send
  {
    recipientCode: "EST-2026-A",
    content: "Hola, necesito ayuda",
    messageType: "TEXT",
    caseId: "case_123" (opcional)
  }
  ↓
Servidor:
  1. Verificar que receptor existe
  2. Crear registro en Messages table
  3. Actualizar o crear Conversations
  4. Emitir evento WebSocket (tiempo real)
  5. Retornar ID del mensaje
```

### Usuario Recibe Mensaje
```
Cliente → GET /api/messages/inbox
  ↓
Servidor:
  1. Obtener todos los mensajes donde recipient = usuario logueado
  2. Agrupar por conversación
  3. Retornar con estado (READ, UNREAD)
```

### Usuario Marca Como Leído
```
Cliente → PUT /api/messages/:messageId/read
  ↓
Servidor:
  1. Actualizar status a READ
  2. Registrar readAt timestamp
  3. Emitir evento WebSocket
```

## 3. Endpoints Necesarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/messages/send` | Enviar nuevo mensaje |
| GET | `/api/messages/inbox` | Obtener bandeja de entrada |
| GET | `/api/messages/conversation/:code` | Obtener conversación con usuario específico |
| GET | `/api/messages/unread-count` | Contar mensajes sin leer |
| PUT | `/api/messages/:messageId/read` | Marcar como leído |
| DELETE | `/api/messages/:messageId` | Eliminar mensaje |
| GET | `/api/messages/by-case/:caseId` | Mensajes relacionados a un caso |

## 4. Modelo de Datos

### Message Object
```typescript
interface Message {
  id: string;                 // chat_1234567
  senderId: string;          // usr_001
  senderCode: string;        // EST-2026-A
  senderRole: string;        // STUDENT
  recipientId: string;       // usr_admin
  recipientCode: string;     // ADM-MASTER
  recipientRole: string;     // ADMIN
  content: string;           // "Texto del mensaje"
  status: 'UNREAD' | 'READ' | 'DELETED';
  messageType: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT';
  attachmentUrl?: string;    // URL si hay adjunto
  conversationId: string;    // conv_123
  caseId?: string;           // case_456 (opcional)
  createdAt: string;         // ISO timestamp
  readAt?: string;           // ISO timestamp cuando se leyó
}

interface Conversation {
  id: string;
  participant1Code: string;  // EST-2026-A
  participant2Code: string;  // ADM-MASTER
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;       // Solo en frontend
  messages: Message[];       // Solo en frontend
}
```

## 5. Estados de Mensaje

- **UNREAD**: Mensaje recibido pero no leído
- **READ**: Mensaje leído
- **DELETED**: Mensaje eliminado por el usuario

## 6. Tipos de Mensaje

- **TEXT**: Mensaje de texto normal
- **FILE**: Mensaje con adjunto (PDF, Word, etc)
- **MEDIA**: Imagen, video, audio
- **ALERT**: Alerta del sistema o escalamiento

## 7. WebSocket para Tiempo Real (Opcional)

Para notificaciones instantáneas:

```javascript
// Cliente
const ws = new WebSocket('wss://cuentame.azurewebsites.net/ws/messages');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Nuevo mensaje recibido:', message);
  // Actualizar UI en tiempo real
};

// Servidor (usando socket.io o ws)
io.on('connection', (socket) => {
  socket.on('message:send', (msg) => {
    // Guardar en BD
    // Emitir a receptor
    io.to(recipientCode).emit('message:received', msg);
  });
});
```

## 8. Privacidad y Seguridad

- ✅ Solo usuarios autenticados pueden enviar/recibir
- ✅ Usuario solo ve sus propios mensajes
- ✅ STAFF puede ver conversaciones de casos asignados
- ✅ Mensajes se cifran en tránsito (HTTPS/WSS)
- ✅ No se almacenan datos personales (solo códigos)

## 9. Testing de Endpoints

```bash
# Enviar mensaje
curl -X POST https://cuentame.azurewebsites.net/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientCode": "ADM-MASTER",
    "content": "Hola, necesito ayuda",
    "messageType": "TEXT",
    "caseId": "case_123"
  }'

# Obtener bandeja de entrada
curl https://cuentame.azurewebsites.net/api/messages/inbox

# Obtener conversación específica
curl https://cuentame.azurewebsites.net/api/messages/conversation/ADM-MASTER

# Marcar como leído
curl -X PUT https://cuentame.azurewebsites.net/api/messages/msg_123/read

# Contar no leídos
curl https://cuentame.azurewebsites.net/api/messages/unread-count
```

## 10. Próximos Pasos

1. ✅ Crear tabla SQL (arriba)
2. Crear endpoints en server.js
3. Crear funciones frontend en storageService.ts
4. Crear componente UI para mensajería
5. Implementar WebSocket (opcional)
