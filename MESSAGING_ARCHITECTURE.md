# 📨 Arquitectura de Mensajería CUÉNTAME

## 🎯 Descripción General

Sistema de mensajería bidireccional vinculado a casos de conflicto, con rutas diferenciadas según rol de usuario.

### Principio Central
**`conversationId = caseId`** - Todo mensaje está vinculado a un caso específico para trazabilidad e identificación.

---

## 🔄 Flujo de Mensajería por Rol

### 1️⃣ **STAFF (Gestor Institucional)**
- **Ubicación de envío/recepción**: Gestión de Caso (`CaseDetail.tsx`)
- **Acción**: El staff ve los mensajes asociados al caso directamente en el panel de gestión
- **Ruta API**: `/api/messages/by-case/{caseId}`
- **Función**: `getMessagesByCase(caseId: string)`

```typescript
// En CaseDetail.tsx - Staff entra al caso y ve todos los mensajes
const messagesInCase = await getMessagesByCase(caseData.id);
```

---

### 2️⃣ **ESTUDIANTES, FAMILIARES, DOCENTES**
- **Ubicación de envío/recepción**: Buzón de Mensajes (`MessagingInterface.tsx`)
- **Acción**: Ven todos sus mensajes en un buzón unificado, agrupados por caso
- **Ruta API**: `/api/messages/inbox?userCode={userCode}`
- **Función**: `getInbox(userCode: string)`

```typescript
// En MessagingInterface.tsx - Usuario ve su buzón
const inbox = await getInbox(userCode);
// Los mensajes tienen conversationId = caseId para identificar de qué caso son
```

---

## 📋 Estructura de Datos - Message

```typescript
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
  
  conversationId: string;      // ← VINCULADO AL CASO
  caseId?: string;             // Referencia explícita al caso
  
  createdAt: string;
  readAt?: string;
}
```

---

## 🔗 Matriz de Interacciones

| Remitente | Receptor | Ubicación Envío | Ubicación Recepción | conversationId |
|-----------|----------|-----------------|---------------------|----------------|
| **Staff** | Estudiante | CaseDetail | MessagingInterface (Inbox) | caseId |
| **Staff** | Padre | CaseDetail | MessagingInterface (Inbox) | caseId |
| **Staff** | Docente | CaseDetail | MessagingInterface (Inbox) | caseId |
| **Estudiante** | Staff | MessagingInterface | CaseDetail | caseId |
| **Padre** | Staff | MessagingInterface | CaseDetail | caseId |
| **Docente** | Staff | MessagingInterface | CaseDetail | caseId |

---

## 🛠️ Funciones Disponibles

### Para Staff (CaseDetail)

```typescript
// Obtener todos los mensajes de un caso
getMessagesByCase(caseId: string): Promise<Message[]>

// Enviar mensaje a usuario y registrarlo en el caso
sendMessageWithCase(
  caseId: string,           // Vinculación al caso
  recipientCode: string,    // Destinatario
  content: string,
  userCode: string,         // Staff enviando
  messageType?: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT'
): Promise<{ id: string; conversationId: string } | null>
```

### Para Usuarios (MessagingInterface)

```typescript
// Obtener todos los mensajes del usuario
getInbox(userCode: string): Promise<Message[]>

// Obtener conversación específica con otro usuario (filtrada por caseId)
getConversationByCase(
  userCode: string,
  otherCode: string,
  caseId: string
): Promise<Message[]>

// Enviar mensaje vinculado a caso
sendMessage(
  recipientCode: string,
  content: string,
  userCode: string,
  messageType?: 'TEXT' | 'FILE' | 'MEDIA' | 'ALERT',
  caseId?: string              // ← CRÍTICO: vincular al caso
): Promise<{ id: string; conversationId: string } | null>

// Obtener mensajes no leídos
getUnreadCount(userCode: string): Promise<number>

// Marcar como leído
markAsRead(messageId: string): Promise<boolean>
```

---

## 📱 Componentes Afectados

### CaseDetail.tsx
```typescript
// Nueva sección: Mensajes del Caso
<section>
  <h3>Mensajes Directos</h3>
  
  // Enviar mensaje
  <textarea value={messageContent} placeholder="Mensaje al usuario..." />
  <button onClick={sendCaseMessage}>Enviar</button>
  
  // Ver conversación del caso
  {messagesInCase.map(msg => (
    <div key={msg.id} className="message">
      <p>{msg.senderCode}: {msg.content}</p>
      <time>{new Date(msg.createdAt).toLocaleString()}</time>
    </div>
  ))}
</section>
```

### MessagingInterface.tsx
```typescript
// El componente ya existe
// Mejora: Agrupar mensajes por caseId
const messagesByCase = groupBy(inbox, msg => msg.caseId);

// Mostrar casos en sidebar
{Object.entries(messagesByCase).map(([caseId, messages]) => (
  <div key={caseId}>
    <h4>Caso #{caseId}</h4>
    <div>{messages.length} mensajes</div>
  </div>
))}
```

---

## ✅ Checklist de Implementación

- [ ] Actualizar `sendMessage` para incluir `caseId` obligatoriamente
- [ ] Crear `sendMessageWithCase` para staff en CaseDetail
- [ ] Crear `getMessagesByCase` para cargar mensajes del caso
- [ ] Crear `getConversationByCase` para filtrar por caso
- [ ] Agregar sección de "Mensajes Directos" en CaseDetail
- [ ] Agrupar inbox por `caseId` en MessagingInterface
- [ ] Backend: Implementar endpoints `/api/messages/by-case/{caseId}`
- [ ] Backend: Implementar filtrado de inbox por caseId en `/api/messages/inbox`
- [ ] Testes: Validar que `conversationId === caseId`
- [ ] UI: Indicador visual de mensajes sin leer por caso

---

## 🔐 Consideraciones de Seguridad

1. **Staff solo ve mensajes de su caso asignado**
   - Validación backend: `WHERE caseId = ? AND assignedTo = ?`

2. **Usuarios solo ven sus propios mensajes**
   - Validación backend: `WHERE recipientCode = ? OR senderCode = ?`

3. **Encriptación de identidad**
   - Usar `encryptedUserCode` en lugar de ID real
   - Mantener identidad anónima excepto para staff autorizado

4. **Auditoría**
   - Todos los mensajes quedan registrados en el caso
   - No se permite eliminar mensajes (solo marcar como DELETED)

---

## 📊 Ejemplo de Flujo Completo

### Escenario: Staff responde a Estudiante

```
1. Estudiante envía mensaje desde MessagingInterface
   → sendMessage(staffCode, "Tengo un problema", studentCode, 'TEXT', caseId)
   → Mensaje guardado con conversationId = caseId

2. Staff ve el caso en CaseDetail
   → getMessagesByCase(caseId) carga mensajes
   → Staff ve mensaje del estudiante

3. Staff responde
   → sendMessageWithCase(caseId, studentCode, "Aquí está la solución", staffCode)
   → conversationId = caseId automáticamente

4. Estudiante ve respuesta en Inbox
   → getInbox(studentCode) incluye mensaje del staff
   → Agrupa por caseId = conversationId
   → Marca como leído → markAsRead(messageId)
```

---

## 🚀 Próximas Mejoras

1. Notificaciones en tiempo real (WebSocket)
2. Adjuntos/Archivos en mensajes
3. Mencionaciones (@usuario)
4. Templados de respuestas rápidas para staff
5. Historial de mensajes archivables
6. Búsqueda full-text en conversaciones
