# 🔧 Especificación de Endpoints Backend

## Descripción General

Estos endpoints deben ser implementados en `server.js` para soportar la arquitectura de mensajería completa.

---

## 📨 ENDPOINTS DE MENSAJERÍA

### 1. Enviar Mensaje Vinculado a Caso

**Endpoint**: `POST /api/messages/send-case`

**Propósito**: Staff envía mensaje desde CaseDetail directamente vinculado a un caso

**Headers Requeridos**:
```
'Content-Type': 'application/json'
'x-user-code': 'STAFF_USER'
```

**Body**:
```json
{
  "caseId": "1234",
  "recipientCode": "EST-2024-A",
  "content": "Aquí está la solución a tu problema...",
  "messageType": "TEXT",
  "attachmentUrl": null
}
```

**Response - Exitosa (200)**:
```json
{
  "id": "msg_abc123",
  "conversationId": "1234"
}
```

**Response - Error (400/500)**:
```json
{
  "error": "Descripción del error"
}
```

**Lógica Backend**:
```javascript
POST /api/messages/send-case
├─ Validar x-user-code = Staff
├─ Validar que caseId existe
├─ Validar que recipientCode existe
├─ Crear objeto Message:
│  ├─ id: generado único
│  ├─ senderId: ID del staff
│  ├─ senderCode: 'STAFF_USER'
│  ├─ senderRole: 'STAFF'
│  ├─ recipientCode: desde request
│  ├─ recipientRole: obtener de BD
│  ├─ conversationId: caseId (IMPORTANTE)
│  ├─ caseId: caseId (referencia explícita)
│  ├─ content: desde request
│  ├─ status: 'UNREAD'
│  ├─ messageType: desde request
│  ├─ createdAt: new Date().toISOString()
│  └─ readAt: null
├─ Guardar en tabla messages (BD)
├─ Guardar en tabla case_messages (vinculación)
└─ Retornar { id, conversationId }
```

---

### 2. Obtener Mensajes de Caso

**Endpoint**: `GET /api/messages/by-case/{caseId}`

**Propósito**: Obtener todos los mensajes asociados a un caso específico

**Headers Requeridos**:
```
'Content-Type': 'application/json'
```

**Query Parameters**:
```
?limit=100
?offset=0
```

**Response - Exitosa (200)**:
```json
[
  {
    "id": "msg_001",
    "senderId": "usr_001",
    "senderCode": "EST-2024-A",
    "senderRole": "STUDENT",
    "recipientCode": "STAFF_USER",
    "content": "Tengo un problema...",
    "status": "READ",
    "messageType": "TEXT",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2024-01-19T10:30:00Z",
    "readAt": "2024-01-19T10:35:00Z"
  },
  {
    "id": "msg_002",
    "senderId": "staff_001",
    "senderCode": "STAFF_USER",
    "senderRole": "STAFF",
    "recipientCode": "EST-2024-A",
    "content": "Aquí está la solución...",
    "status": "UNREAD",
    "messageType": "TEXT",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2024-01-19T10:45:00Z",
    "readAt": null
  }
]
```

**Lógica Backend**:
```javascript
GET /api/messages/by-case/{caseId}
├─ Validar que caseId existe
├─ Query BD:
│  SELECT * FROM messages
│  WHERE caseId = ? AND conversationId = ?
│  ORDER BY createdAt ASC
│  LIMIT ? OFFSET ?
├─ Retornar array de messages ordenadas por fecha
└─ Si no hay mensajes, retornar []
```

---

### 3. Enviar Mensaje General (Existente)

**Endpoint**: `POST /api/messages/send`

**Propósito**: Usuarios envían mensaje (mejora: agregar vinculación a caso)

**Headers Requeridos**:
```
'Content-Type': 'application/json'
'x-user-code': 'EST-2024-A'
```

**Body**:
```json
{
  "recipientCode": "STAFF_USER",
  "content": "Tengo una pregunta sobre mi caso...",
  "messageType": "TEXT",
  "caseId": "1234",
  "attachmentUrl": null
}
```

**Response**:
```json
{
  "id": "msg_003",
  "conversationId": "1234"
}
```

**Lógica Backend** (MEJORADA):
```javascript
POST /api/messages/send
├─ Obtener userCode de header x-user-code
├─ Validar recipientCode existe
├─ Crear objeto Message:
│  ├─ conversationId: caseId || generador_único()
│  ├─ caseId: caseId (desde request, puede ser null)
│  └─ ... otros campos
├─ Guardar en BD
└─ Retornar { id, conversationId }

// CAMBIO IMPORTANTE:
// Antes: conversationId era generado entre dos usuarios
// Ahora: Si viene caseId, conversationId = caseId
//        Si no, usar sistema antiguo
```

---

### 4. Obtener Inbox Filtrado

**Endpoint**: `GET /api/messages/inbox`

**Propósito**: Obtener todos los mensajes del usuario (inbox)

**Headers Requeridos**:
```
'x-user-code': 'EST-2024-A'
```

**Query Parameters**:
```
?caseId=1234        // Filtrar por caso (opcional)
?unread=true        // Solo no leídos (opcional)
```

**Response**:
```json
[
  {
    "id": "msg_001",
    "senderId": "staff_001",
    "senderCode": "STAFF_USER",
    "senderRole": "STAFF",
    "recipientCode": "EST-2024-A",
    "content": "Tu caso está en proceso...",
    "status": "UNREAD",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2024-01-19T10:30:00Z"
  }
]
```

**Lógica Backend** (MEJORADA):
```javascript
GET /api/messages/inbox
├─ Obtener userCode de header
├─ Build Query:
│  SELECT * FROM messages
│  WHERE (recipientCode = ? OR senderCode = ?)
│  AND deletedAt IS NULL
├─ Si ?caseId: AND caseId = ?
├─ Si ?unread: AND status = 'UNREAD'
├─ ORDER BY createdAt DESC
└─ Retornar array con groupBy conversationId (frontend)
```

---

### 5. Obtener Conversación por Caso

**Endpoint**: `GET /api/messages/conversation/{otherCode}`

**Propósito**: Obtener conversación entre dos usuarios en un caso específico

**Headers Requeridos**:
```
'x-user-code': 'EST-2024-A'
```

**Query Parameters**:
```
?caseId=1234        // Filtrar por caso específico
```

**Response**:
```json
[
  {
    "id": "msg_001",
    "senderId": "usr_001",
    "senderCode": "EST-2024-A",
    "content": "Hola, tengo un problema",
    "status": "READ",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2024-01-19T10:00:00Z"
  },
  {
    "id": "msg_002",
    "senderId": "staff_001",
    "senderCode": "STAFF_USER",
    "content": "Te ayudaré con eso",
    "status": "UNREAD",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2024-01-19T10:30:00Z"
  }
]
```

**Lógica Backend**:
```javascript
GET /api/messages/conversation/{otherCode}
├─ Obtener userCode de header
├─ Validar otherCode existe
├─ Si ?caseId:
│  ├─ Query específica para ese caso
│  └─ WHERE caseId = ? AND conversationId = ?
├─ Si no caseId:
│  ├─ Query conversación general
│  └─ WHERE (
│      (senderCode = ? AND recipientCode = ?)
│      OR (senderCode = ? AND recipientCode = ?)
│    )
├─ ORDER BY createdAt ASC
└─ Retornar array
```

---

### 6. Marcar Mensaje como Leído

**Endpoint**: `PUT /api/messages/{messageId}/read`

**Propósito**: Marcar un mensaje como leído

**Headers Requeridos**:
```
'Content-Type': 'application/json'
'x-user-code': 'EST-2024-A'
```

**Body**:
```json
{}
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_001"
}
```

**Lógica Backend**:
```javascript
PUT /api/messages/{messageId}/read
├─ Obtener userCode de header
├─ Validar que message existe
├─ Validar que recipient = userCode
├─ UPDATE messages
│  SET status = 'READ', readAt = NOW()
│  WHERE id = ?
└─ Retornar { success: true, messageId }
```

---

### 7. Eliminar Mensaje (Soft Delete)

**Endpoint**: `DELETE /api/messages/{messageId}`

**Propósito**: Marcar mensaje como eliminado (no realmente borrar)

**Headers Requeridos**:
```
'x-user-code': 'EST-2024-A'
```

**Response**:
```json
{
  "success": true,
  "messageId": "msg_001"
}
```

**Lógica Backend**:
```javascript
DELETE /api/messages/{messageId}
├─ Validar autorización (sender o admin)
├─ UPDATE messages
│  SET status = 'DELETED', deletedAt = NOW()
│  WHERE id = ?
├─ NOT DELETE - solo marcar como eliminado
└─ En queries, siempre filtrar: deletedAt IS NULL
```

---

## 📊 Estructura de Tabla BD

### Tabla: `messages`

```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  
  -- Remitente
  senderId VARCHAR(36) NOT NULL,
  senderCode VARCHAR(50) NOT NULL,
  senderRole ENUM('STUDENT','PARENT','TEACHER','STAFF','ADMIN'),
  
  -- Destinatario
  recipientId VARCHAR(36) NOT NULL,
  recipientCode VARCHAR(50) NOT NULL,
  recipientRole ENUM('STUDENT','PARENT','TEACHER','STAFF','ADMIN'),
  
  -- Contenido
  content LONGTEXT NOT NULL,
  messageType VARCHAR(20) DEFAULT 'TEXT',
  attachmentUrl VARCHAR(500),
  
  -- Vinculación a Caso (IMPORTANTE)
  conversationId VARCHAR(50) NOT NULL,  -- conversationId = caseId
  caseId VARCHAR(50),                    -- Referencia explícita
  
  -- Estado
  status ENUM('UNREAD','READ','DELETED') DEFAULT 'UNREAD',
  
  -- Auditoría
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  readAt TIMESTAMP NULL,
  deletedAt TIMESTAMP NULL,
  
  -- Índices para performance
  INDEX idx_conversation (conversationId),
  INDEX idx_case (caseId),
  INDEX idx_recipient (recipientCode),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);
```

### Tabla: `case_messages` (Vinculación)

```sql
CREATE TABLE case_messages (
  id VARCHAR(36) PRIMARY KEY,
  caseId VARCHAR(50) NOT NULL,
  messageId VARCHAR(36) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_message (messageId),
  FOREIGN KEY (caseId) REFERENCES conflict_cases(id),
  FOREIGN KEY (messageId) REFERENCES messages(id)
);
```

---

## 🔒 Validaciones Backend Requeridas

### Para `sendMessageWithCase`:
```javascript
✓ x-user-code debe ser válido
✓ caseId debe existir en tabla conflict_cases
✓ recipientCode debe existir en tabla users
✓ Usuario debe estar autorizado (staff del caso)
✓ content no puede estar vacío
✓ messageType debe ser válido enum
```

### Para `getMessagesByCase`:
```javascript
✓ caseId debe existir
✓ Validar permisos (solo staff de ese caso)
✓ Paginar resultados (limit, offset)
✓ Ordenar por createdAt ASC
```

### Para `getInbox`:
```javascript
✓ userCode válido y activo
✓ Solo retornar mensajes dirigidos a este usuario
✓ Respetar soft delete (deletedAt IS NULL)
```

---

## 🔄 Flujo Completo Backend

### 1. Staff envía mensaje desde CaseDetail

```
Frontend: sendMessageWithCase(
  caseId: "1234",
  recipientCode: "EST-2024-A",
  content: "Aquí está la solución",
  userCode: "STAFF_USER"
)
    ↓
POST /api/messages/send-case
    ├─ Validar staff autorizado para caso 1234
    ├─ Crear Message con:
    │  ├─ conversationId = "1234"
    │  ├─ caseId = "1234"
    │  └─ status = "UNREAD"
    ├─ INSERT messages
    ├─ INSERT case_messages (vinculación)
    └─ Response { id, conversationId: "1234" }
    ↓
Frontend: Actualiza lista local
```

### 2. Usuario (Estudiante) ve mensaje en Inbox

```
Frontend: getInbox(userCode: "EST-2024-A")
    ↓
GET /api/messages/inbox
    ├─ Query: WHERE recipientCode = "EST-2024-A"
    ├─ Filtra con deletedAt IS NULL
    ├─ Agrupa por conversationId
    └─ Retorna array de messages
    ↓
Frontend: groupMessagesByCase(messages)
    ├─ Agrupa por caseId
    ├─ Muestra en pestaña "📋 Casos"
    └─ Usuario haz click en "Caso #1234"
```

### 3. Usuario responde desde Inbox

```
Frontend: handleSendMessage() con caseId
    ↓
sendMessage(
  recipientCode: "STAFF_USER",
  content: "Gracias, lo intentaré",
  userCode: "EST-2024-A",
  caseId: "1234"  // ← NUEVO
)
    ↓
POST /api/messages/send
    ├─ Crear Message con:
    │  ├─ conversationId = "1234" (desde request)
    │  ├─ caseId = "1234"
    │  └─ status = "UNREAD"
    ├─ INSERT messages
    └─ Response { id, conversationId: "1234" }
    ↓
Frontend: Actualiza hilo local
```

### 4. Staff ve respuesta del usuario

```
Frontend: useEffect() cada 10 segundos
    ↓
getMessagesByCase(caseId: "1234")
    ↓
GET /api/messages/by-case/1234
    ├─ Query: WHERE caseId = "1234"
    ├─ ORDER BY createdAt ASC
    └─ Retorna array incluyendo nuevo mensaje
    ↓
Frontend: setCaseMessages(messages)
    └─ Usuario ve respuesta del estudiante en verde
```

---

## 🚀 Implementación Priority

**Fase 1 - CRÍTICA** (Requerida para MVP):
- [ ] POST /api/messages/send-case
- [ ] GET /api/messages/by-case/{caseId}
- [ ] Actualizar POST /api/messages/send (agregar caseId)
- [ ] Actualizar GET /api/messages/inbox (respetar caseId)

**Fase 2 - IMPORTANTE** (Validación):
- [ ] PUT /api/messages/{messageId}/read
- [ ] GET /api/messages/conversation/{otherCode}?caseId=X
- [ ] DELETE /api/messages/{messageId}

**Fase 3 - OPCIONAL** (Mejoras):
- [ ] WebSocket para notificaciones real-time
- [ ] Adjuntos/Archivos
- [ ] Búsqueda full-text
- [ ] Plantillas rápidas

---

## 📝 Notas Importantes

1. **conversationId = caseId es CRÍTICO**
   - Garantiza que todo mensaje esté vinculado a su caso
   - Permite auditoría y trazabilidad
   - Simplifica queries de búsqueda

2. **Soft Delete, No Hard Delete**
   - Nunca eliminar un mensaje completamente
   - Solo marcar como status='DELETED'
   - Requiere siempre filtrar deletedAt IS NULL

3. **Validaciones de Rol**
   - Staff solo puede enviar desde casos asignados
   - Usuarios solo ven mensajes dirigidos a ellos
   - Admin puede ver todo

4. **Performance**
   - Crear índices en conversationId, caseId, recipientCode
   - Paginar resultados grandes (limit, offset)
   - Cache de mensajes no leídos

5. **Auditoría**
   - Guardar createdAt, readAt, deletedAt
   - Considerar tabla de logs para compliance
   - Mantener historial completo

---

Estos endpoints completarán la arquitectura de mensajería bidireccional vinculada a casos.
