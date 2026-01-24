# ✅ Backend Implementado - Sistema de Mensajería CUÉNTAME

## 🎯 Cambios en server.js

### 1. Nuevas Tablas de Base de Datos

Se agregaron las siguientes tablas a `createTables()`:

#### **Tabla: Conversations**
```sql
CREATE TABLE Conversations (
  id NVARCHAR(50) PRIMARY KEY,
  participant1Code NVARCHAR(50) NOT NULL,
  participant2Code NVARCHAR(50) NOT NULL,
  lastMessage NVARCHAR(255),
  lastMessageAt DATETIME,
  createdAt DATETIME DEFAULT GETUTCDATE(),
  updatedAt DATETIME DEFAULT GETUTCDATE()
);
```

#### **Tabla: Messages** (CRÍTICA)
```sql
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
  conversationId NVARCHAR(50) NOT NULL,       -- ← Vinculación a conversación
  caseId NVARCHAR(50),                        -- ← Vinculación a caso
  createdAt DATETIME DEFAULT GETUTCDATE(),
  readAt DATETIME NULL,
  deletedAt DATETIME NULL,
  
  -- ÍNDICES para performance
  INDEX idx_conversation (conversationId),
  INDEX idx_case (caseId),
  INDEX idx_recipient (recipientCode),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);
```

---

### 2. Nuevo Endpoint: POST /api/messages/send-case

**Propósito**: Permitir que el Staff envíe mensajes vinculados a un caso específico

**Ubicación en code**: Línea ~814

**Funcionamiento**:
1. ✅ Valida que caseId, recipientCode y content estén presentes
2. ✅ Obtiene info del remitente (Staff) desde header x-user-code
3. ✅ Obtiene info del destinatario (Usuario) desde la BD
4. ✅ Verifica que el caso exista
5. ✅ **CRÍTICO**: Asigna `conversationId = caseId`
6. ✅ Inserta mensaje en tabla Messages
7. ✅ Retorna `{ id, conversationId, caseId, status, createdAt }`

**Request**:
```json
POST /api/messages/send-case
Content-Type: application/json
x-user-code: STAFF_USER

{
  "caseId": "1234",
  "recipientCode": "EST-2024-A",
  "content": "Aquí está la solución...",
  "messageType": "TEXT",
  "attachmentUrl": null
}
```

**Response (200)**:
```json
{
  "id": "msg_1705689000000",
  "conversationId": "1234",
  "caseId": "1234",
  "status": "sent",
  "createdAt": "2026-01-19T10:30:00.000Z"
}
```

---

### 3. Endpoint Mejorado: GET /api/messages/by-case/:caseId

**Cambios**:
- ✅ Ahora ordena por `createdAt ASC` (cronológico, no DESC)
- ✅ Retorna array vacío si no hay mensajes (no null)
- ✅ Logs mejorados con prefijo [CASE]

**Request**:
```
GET /api/messages/by-case/1234
```

**Response (200)**:
```json
[
  {
    "id": "msg_001",
    "senderId": "usr_001",
    "senderCode": "STAFF_USER",
    "senderRole": "STAFF",
    "recipientCode": "EST-2024-A",
    "content": "Aquí está la solución...",
    "status": "UNREAD",
    "messageType": "TEXT",
    "conversationId": "1234",
    "caseId": "1234",
    "createdAt": "2026-01-19T10:30:00.000Z"
  }
]
```

---

## 📊 Flujo Completo: Frontend → Backend → BD

### 1. Staff envía mensaje desde CaseDetail

```
Frontend (React)
  ↓
  sendMessageWithCase(
    caseId: "1234",
    recipientCode: "EST-2024-A",
    content: "Respuesta del staff",
    userCode: "STAFF_USER"
  )
  ↓
  HTTP POST /api/messages/send-case
  (con header x-user-code: STAFF_USER)
  ↓
  Backend (server.js)
  ├─ Valida campos
  ├─ Obtiene info Staff
  ├─ Obtiene info Usuario
  ├─ Verifica caso existe
  ├─ conversationId = caseId = "1234" ✓
  ├─ INSERT INTO Messages (...)
  └─ RESPONSE { id, conversationId: "1234", ... }
  ↓
  BD (Azure SQL)
  └─ Tabla Messages
     ├─ id: msg_001
     ├─ senderCode: STAFF_USER
     ├─ recipientCode: EST-2024-A
     ├─ content: "Respuesta del staff"
     ├─ conversationId: 1234 ← CRÍTICO
     ├─ caseId: 1234 ← CRÍTICO
     └─ createdAt: ...
```

### 2. Frontend recibe respuesta

```
Frontend (CaseDetail)
  ↓
  useEffect recargar cada 10s
  ↓
  getMessagesByCase(caseId)
  ↓
  HTTP GET /api/messages/by-case/1234
  ↓
  Backend
  └─ SELECT * FROM Messages
     WHERE caseId = @caseId
     ORDER BY createdAt ASC
  ↓
  Retorna array de mensajes
  ↓
  Frontend actualiza state
  ↓
  UI muestra todos los mensajes
```

---

## 🔄 Endpoints Disponibles en Backend

### Mensajería por Caso (NUEVOS)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/messages/send-case` | POST | Enviar mensaje vinculado a caso |
| `/api/messages/by-case/:caseId` | GET | Obtener mensajes del caso |

### Mensajería General (EXISTENTES)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/messages/send` | POST | Enviar mensaje general |
| `/api/messages/inbox` | GET | Obtener buzón del usuario |
| `/api/messages/conversation/:code` | GET | Obtener conversación con usuario |
| `/api/messages/unread-count` | GET | Contar sin leer |
| `/api/messages/:messageId/read` | PUT | Marcar como leído |
| `/api/messages/:messageId` | DELETE | Eliminar mensaje (soft delete) |

---

## ✅ Estado Final

### ¿Dónde se guardan los mensajes?

✅ **EN LA BASE DE DATOS**  
- Tabla: `Messages` (Azure SQL)
- conversationId = caseId (garantizado)
- Índices para performance
- Soft delete implementation

### ¿Dónde se muestran en Frontend?

✅ **EN CASEDETAIL** (Staff)
- Sección #6: "Hilo de Conversación"
- Auto-actualiza cada 10 segundos
- Muestra todos los mensajes del caso

✅ **EN MESSAGINGINTERFACE** (Usuarios)
- Pestaña "📋 Casos"
- Agrupa mensajes por caseId
- Click para ver hilo completo

---

## 🚀 Build Status

**Frontend**: ✅ Compilado exitosamente  
**Backend**: ✅ Endpoints implementados  
**Base de Datos**: ✅ Tablas creadas automáticamente  

**Total líneas de código**: ~100 líneas (backend)

---

## 📝 Próximos Pasos

1. ✅ Implementación completada
2. ⏳ Deploy a Azure
3. ⏳ Testing en ambiente live
4. ⏳ Capacitación de usuarios

---

## 🔗 Verificar Funcionamiento

### Test Local

```bash
# 1. Compilar
npm run build

# 2. Iniciar servidor
node server.js

# 3. Enviar mensaje de prueba
curl -X POST http://localhost:3000/api/messages/send-case \
  -H "Content-Type: application/json" \
  -H "x-user-code: STAFF_USER" \
  -d '{
    "caseId": "1234",
    "recipientCode": "EST-2024-A",
    "content": "Prueba de mensaje",
    "messageType": "TEXT"
  }'

# 4. Obtener mensajes del caso
curl http://localhost:3000/api/messages/by-case/1234
```

---

**¡Sistema de Mensajería CUÉNTAME v2.0 - COMPLETAMENTE IMPLEMENTADO!** 🎉
