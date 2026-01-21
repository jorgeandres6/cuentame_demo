# 📨 Sistema de Mensajería - Guía Completa de Integración

## ✅ Implementación Completada

He creado un **sistema de mensajería completo** entre usuarios (especialmente STAFF con otros usuarios) que incluye:

### 1. **Base de Datos**
- Tabla `Messages`: Almacena todos los mensajes entre usuarios
- Tabla `Conversations`: Agrupa mensajes por conversación
- Índices para búsquedas rápidas
- Script SQL en [MESSAGING_SYSTEM_SETUP.md](MESSAGING_SYSTEM_SETUP.md)

### 2. **Backend (Node.js)**
Endpoints REST implementados en `server.js`:
- `POST /api/messages/send` - Enviar mensaje
- `GET /api/messages/inbox` - Obtener bandeja
- `GET /api/messages/conversation/:code` - Obtener conversación
- `GET /api/messages/unread-count` - Contar sin leer
- `PUT /api/messages/:messageId/read` - Marcar leído
- `DELETE /api/messages/:messageId` - Eliminar
- `GET /api/messages/by-case/:caseId` - Mensajes por caso

### 3. **Frontend**
Funciones en `services/storageService.ts`:
- `sendMessage()` - Enviar mensaje
- `getInbox()` - Obtener bandeja
- `getConversation()` - Obtener chat
- `getUnreadCount()` - Contar no leídos
- `markAsRead()` - Marcar leído
- `deleteMessage()` - Eliminar
- `getMessagesByCase()` - Por caso

### 4. **Componente UI**
`MessagingInterface.tsx` incluye:
- Sidebar con lista de conversaciones
- Chat con la conversación seleccionada
- Auto-scroll a últimos mensajes
- Indicador de mensajes sin leer
- Input para escribir mensajes
- Recarga automática cada 5 segundos

## 🚀 Pasos para Activar

### PASO 1: Crear las Tablas en Azure

1. **Azure Portal** → Base de datos SQL → **Query Editor**
2. Copia y ejecuta el SQL de [MESSAGING_SYSTEM_SETUP.md](MESSAGING_SYSTEM_SETUP.md) (sección "1. Script SQL")

```sql
-- (Se proporciona en el documento)
CREATE TABLE Messages (...)
CREATE TABLE Conversations (...)
```

### PASO 2: Deploy del Código

1. En **VSCode**, abre terminal en `cuentame_demo/`
2. Compila:
   ```bash
   npm run build
   ```

3. Deploy con la extensión Azure:
   - Clic derecho en `cuentame_demo/`
   - Selecciona **Deploy to Web App**
   - Espera 2-3 minutos

### PASO 3: Integrar Componente en la UI

Abre `App.tsx` o tu componente principal y agrega:

```typescript
import { MessagingInterface } from './components/MessagingInterface';
import { UserRole } from './types';

// En tu componente:
<MessagingInterface 
  userCode={currentUser.encryptedCode}
  userRole={currentUser.role}
  isStaff={currentUser.role === UserRole.STAFF}
/>
```

### PASO 4: Testing

#### Test Local
```bash
# Terminal 1: Servidor
npm start

# Terminal 2: Test con curl
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-user-code: EST-2026-A" \
  -d '{
    "recipientCode": "ADM-MASTER",
    "content": "Hola, necesito ayuda",
    "messageType": "TEXT"
  }'
```

#### Test en Azure
1. Login como usuario
2. Abre la sección de mensajes
3. Envía un mensaje a otro usuario
4. Verifica que se guarde en BD

## 📊 Estructura de Datos

### Message Object
```typescript
{
  id: "msg_1234567890",
  senderId: "usr_001",
  senderCode: "EST-2026-A",
  senderRole: "STUDENT",
  recipientId: "usr_admin",
  recipientCode: "ADM-MASTER",
  recipientRole: "ADMIN",
  content: "Hola, necesito ayuda con un conflicto",
  status: "UNREAD", // UNREAD | READ | DELETED
  messageType: "TEXT", // TEXT | FILE | MEDIA | ALERT
  attachmentUrl: null,
  conversationId: "conv_1234567890",
  caseId: "case_456", // opcional
  createdAt: "2026-01-19T15:30:00Z",
  readAt: null
}
```

### Conversation Object
```typescript
{
  id: "conv_1234567890",
  participant1Code: "EST-2026-A",
  participant2Code: "ADM-MASTER",
  lastMessage: "Hola, necesito ayuda...",
  lastMessageAt: "2026-01-19T15:30:00Z",
  createdAt: "2026-01-19T15:25:00Z",
  updatedAt: "2026-01-19T15:30:00Z"
}
```

## 🔄 Flujo de Comunicación

### Enviar Mensaje
```
Usuario A (EST-2026-A)
  ↓
Hace click en usuario B
  ↓
Escribe "Hola necesito ayuda"
  ↓
Presiona Enviar
  ↓
Frontend: sendMessage(recipientCode, content, userCode)
  ↓
Backend: POST /api/messages/send
  1. Valida usuario existe
  2. Crea registro en Messages
  3. Actualiza o crea Conversations
  4. Retorna messageId
  ↓
Frontend: Recarga conversación
  ↓
Mensaje aparece en chat
```

### Recibir Mensaje
```
Usuario B (ADM-MASTER)
  ↓
API polling cada 5 segundos: getInbox()
  ↓
Nuevo mensaje aparece en conversación
  ↓
Contador de "no leídos" sube
  ↓
Usuario B abre conversación
  ↓
Frontend: markAsRead(messageId)
  ↓
Status cambia a READ
  ↓
readAt se registra con timestamp
```

## 📱 Estados de Mensaje

| Estado | Significado | Acción |
|--------|------------|--------|
| **UNREAD** | Recibido pero no visto | Mostrar badge rojo |
| **READ** | Usuario vio el mensaje | Cambiar timestamp |
| **DELETED** | Usuario lo eliminó | No mostrar |

## 🔒 Seguridad

✅ **Implementadas:**
- Solo usuarios autenticados pueden enviar/recibir
- Header `x-user-code` valida al usuario
- Usuario solo ve sus propios mensajes
- Mensajes se guardan en BD de forma permanente
- HTTPS encripta en tránsito

## 🚀 Funcionalidades Avanzadas (Opcionales)

### 1. WebSocket para Tiempo Real
```javascript
// Cliente
const ws = new WebSocket('wss://cuentame.azurewebsites.net/ws');
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  console.log('Nuevo mensaje:', msg);
};

// Servidor (agregar a server.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    const msg = JSON.parse(data);
    // Guardar en BD y emitir a otro usuario
    wss.clients.forEach(client => {
      client.send(JSON.stringify(msg));
    });
  });
});
```

### 2. Adjuntos/Files
```typescript
interface Message {
  attachmentUrl?: string;  // URL del archivo
  fileSize?: number;       // Tamaño en bytes
  fileName?: string;       // Nombre original
  mimeType?: string;       // Tipo (PDF, IMG, etc)
}
```

### 3. Notificaciones
```typescript
// Agregar a MessagingInterface
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification(`Nuevo mensaje de ${otherCode}`, {
    body: newMessage.substring(0, 100),
    icon: '/logo.png'
  });
}
```

## 📋 Checklist Final

- [ ] Tablas SQL creadas en Azure
- [ ] Código compilado (`npm run build`)
- [ ] Código deployado (`Deploy to Web App`)
- [ ] MessagingInterface importado en App.tsx
- [ ] Usuarios pueden enviar mensajes
- [ ] Mensajes se guardan en BD
- [ ] Usuarios ven bandeja de entrada
- [ ] Contador de no leídos funciona
- [ ] Marcar como leído funciona
- [ ] Auto-scroll en chat funciona

## 🆘 Troubleshooting

### Error: "User code required in header"
→ Asegúrate de pasar `x-user-code` en headers

### Error: "Recipient not found"
→ Verifica que el código del destinatario existe en UserProfiles

### Mensajes no se guardan
→ Ve a Azure Portal → Log Stream y copia el error exacto

### Interface no se actualiza
→ Verifica que MessagingInterface está importado en el componente padre

## 📞 Soporte

Para preguntas o problemas:
1. Revisa [MESSAGING_SYSTEM_SETUP.md](MESSAGING_SYSTEM_SETUP.md)
2. Checkea los logs en Azure Portal → Log Stream
3. Valida la BD con: `SELECT * FROM Messages;`

---

**Status:** ✅ Implementación Completa  
**Último actualizado:** 2026-01-19  
**Próximos pasos:** Implementar WebSocket para tiempo real (opcional)
