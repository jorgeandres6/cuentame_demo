# ✅ Checklist de Verificación del Sistema de Mensajes

## Estado Actual del Sistema

### **1. Compilación y Errores**
- [ ] `npm run build` ejecutado sin errores
- [ ] No hay errores TypeScript en MessagingInterface.tsx
- [ ] No hay errores TypeScript en storageService.ts
- [ ] No hay errores TypeScript en server.js

### **2. Estructura de Base de Datos**

#### Tablas Necesarias en SQL Server:
```sql
-- MESSAGES table (para BD cuando esté disponible)
CREATE TABLE Messages (
    id NVARCHAR(MAX) PRIMARY KEY,
    senderId NVARCHAR(MAX),
    senderCode NVARCHAR(MAX),
    senderRole NVARCHAR(MAX),
    recipientId NVARCHAR(MAX),
    recipientCode NVARCHAR(MAX),
    recipientRole NVARCHAR(MAX),
    content NVARCHAR(MAX),
    status NVARCHAR(MAX),
    messageType NVARCHAR(MAX),
    conversationId NVARCHAR(MAX),
    caseId NVARCHAR(MAX),
    createdAt DATETIME,
    updatedAt DATETIME
);

-- CONVERSATIONS table (CRÍTICO para mensajes de STAFF)
CREATE TABLE Conversations (
    id NVARCHAR(MAX) PRIMARY KEY,
    participant1Code NVARCHAR(MAX),
    participant2Code NVARCHAR(MAX),
    lastMessage NVARCHAR(MAX),
    lastMessageAt DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

### **3. Componentes Frontend Configurados**

#### MessagingInterface.tsx:
- [ ] useEffect() en mount llama a loadInbox()
- [ ] Intervalo de polling = 2000ms (2 segundos)
- [ ] defaultView = 'conversation' (BUZÓN)
- [ ] loadInbox() agrupa mensajes por conversationId
- [ ] Estado: messagesByCase = { conversationId: Message[] }
- [ ] Vista BUZÓN itera sobre messagesByCase
- [ ] Badge de no leídos se calcula correctamente

#### storageService.ts:
- [ ] getInbox() tiene timeout de 3 segundos
- [ ] Fallback a localStorage si falla servidor
- [ ] getInboxFromLocalStorage() filtra por recipientCode
- [ ] saveMessageToLocalStorage() guarda en MESSAGES y CONVERSATIONS
- [ ] Todas las funciones incluyen try-catch y fallback

#### server.js:
- [ ] Ruta POST /api/messages/send implementada
- [ ] Ruta POST /api/messages/send-case implementada
- [ ] Ruta GET /api/messages/inbox implementada
- [ ] Ruta GET /api/messages/by-case/:caseId implementada
- [ ] Ruta GET /api/cases/messages/:userCode implementada
- [ ] Ruta POST /api/messages/conversation/:code implementada
- [ ] Endpoint /api/messages/send-case crea/actualiza CONVERSATIONS

### **4. Flujo de Datos**

#### Login → Mostrar Mensajes:
```
1. Usuario hace login (loginHandler)
   ↓
2. Se redirige a Dashboard
   ↓
3. Se carga MessagingInterface
   ↓
4. useEffect() monta el componente
   ↓
5. loadInbox() se ejecuta:
   - Intenta: GET /api/messages/inbox
   - Si falla: usa localStorage CUENTAME_MESSAGES
   ↓
6. Los mensajes se filtran por recipientCode === userCode
   ↓
7. Se agrupan por conversationId
   ↓
8. Se actualiza estado: setMessagesByCase(grouped)
   ↓
9. React renderiza conversaciones en BUZÓN
   ↓
10. setInterval cada 2 segundos recarga inbox
```

#### Enviar Mensaje:
```
1. Usuario escribe en caja de texto
   ↓
2. Click enviar o Enter
   ↓
3. handleSendMessage():
   - Valida que no esté vacío
   - Crea objeto Message
   - Llama: storageService.sendMessage()
   ↓
4. storageService.sendMessage():
   - Intenta: POST /api/messages/send
   - Si falla: saveMessageToLocalStorage()
   ↓
5. Si es mensaje STAFF a CASO:
   - Endpoint /api/messages/send-case:
     - Guarda mensaje en Messages
     - Crea/actualiza CONVERSATIONS
   ↓
6. localStorage se sincroniza en 2 segundos
```

### **5. Variables localStorage Necesarias**

```javascript
// En localStorage después de login:
localStorage.getItem('CUENTAME_MESSAGES')  // Array<Message>
localStorage.getItem('CUENTAME_CONVERSATIONS')  // Array<Conversation>
```

### **6. Pruebas Manuales Necesarias**

#### Prueba 1: Visualizar Mensajes
```
1. npm start (servidor)
2. Abre http://localhost:5173
3. Login: EST-2024-A / 123
4. Verifica BUZÓN tenga conversaciones
5. Click en conversación → ver mensajes
✅ ESPERADO: Mensajes aparecen en orden cronológico
```

#### Prueba 2: Enviar Mensaje
```
1. En BUZÓN, click en conversación STAFF-PSI
2. Escribe: "Hola STAFF"
3. Enter
✅ ESPERADO: Mensaje aparece inmediatamente
```

#### Prueba 3: Recibir Mensaje (Simulado)
```
1. Abre consola (F12) → Console
2. Ejecuta test-messages.js (copiar/pegar)
3. Espera 2 segundos
✅ ESPERADO: Nuevos mensajes aparecen sin recargar
```

#### Prueba 4: Sin Base de Datos
```
1. Desconecta SQL Server (O usa localhost:1433 no disponible)
2. Repite Prueba 1-3
✅ ESPERADO: Funciona igual con localStorage
```

### **7. Endpoints API Obligatorios**

| Endpoint | Método | Propósito | Status |
|----------|--------|-----------|--------|
| /api/messages/inbox | GET | Obtener mensajes del usuario | ✅ |
| /api/messages/send | POST | Enviar mensaje normal | ✅ |
| /api/messages/send-case | POST | Enviar mensaje desde STAFF a CASO | ✅ |
| /api/messages/by-case/:caseId | GET | Obtener mensajes por caso | ✅ |
| /api/cases/messages/:userCode | GET | Obtener casos con mensajes | ✅ |
| /api/messages/conversation/:code | GET | Obtener conversación con usuario | ✅ |

### **8. Conversationid Format**

**Formato correcto:**
```
conv_[USER1_CODE]_[USER2_CODE]

Ejemplos:
- conv_EST-2024-A_STAFF-PSI
- conv_USER123_STAFF456
```

**Conversaciones bidireccionales:**
- Si EST-2024-A envía a STAFF-PSI: conversationId = conv_EST-2024-A_STAFF-PSI
- Si STAFF-PSI responde: mismo conversationId = conv_EST-2024-A_STAFF-PSI

### **9. Parámetros de Configuración**

| Parámetro | Valor | Archivo | Descripción |
|-----------|-------|---------|-------------|
| POLLING_INTERVAL | 2000 | MessagingInterface.tsx | ms entre recargas |
| API_TIMEOUT | 3000 | storageService.ts | ms timeout en fetch |
| DB_FALLBACK | ✅ | storageService.ts | Activado localStorage |
| DEFAULT_VIEW | 'conversation' | MessagingInterface.tsx | BUZÓN por defecto |

### **10. Estado Final Esperado**

```javascript
// En MessagingInterface.tsx:
state = {
  messagesByCase: {
    'conv_EST-2024-A_STAFF-PSI': [
      { id: 'msg_001', senderCode: 'STAFF-PSI', content: '...', status: 'UNREAD' },
      { id: 'msg_002', senderCode: 'EST-2024-A', content: '...', status: 'READ' },
      { id: 'msg_003', senderCode: 'STAFF-PSI', content: '...', status: 'UNREAD' }
    ]
  },
  view: 'conversation', // BUZÓN
  loading: false,
  error: null
}
```

---

## 🚀 Próximos Pasos

1. **Asegura que compilación es limpia:**
   ```bash
   npm run build 2>&1 | grep -i error
   ```
   (No debe mostrar errores)

2. **Inicia servidor:**
   ```bash
   npm start
   ```

3. **Abre http://localhost:5173 en navegador**

4. **Ejecuta Prueba 1 del checklist**

5. **Si todo funciona → Sistema está listo ✅**

6. **Si hay problemas → Revisa logs en browser DevTools**

---

## 📋 Notas Importantes

- ✅ **BD NO es requerida para funcionar** (localStorage es suficiente)
- ✅ **Sistema está preparado para cuando BD esté disponible**
- ✅ **Sin recargas de página** (excepto F5 manual)
- ✅ **Tiempo real cada 2 segundos**
- ❌ **No hay WebSocket** (polling es suficiente)
- ⚠️ **Los datos se pierden si se borra localStorage**
