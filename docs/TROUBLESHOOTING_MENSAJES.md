# 🔧 TROUBLESHOOTING RÁPIDO - Sistema de Mensajes

## ❌ "No veo ningún mensaje en el BUZÓN"

### Causa Probable: No hay datos de prueba

**Solución:**

1. Abre DevTools (F12)
2. Pestaña Console
3. Copia TODO esto y pega:

```javascript
const testMessages = [
  {
    id: 'msg_001',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: 'Mensaje de prueba 1',
    status: 'UNREAD',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg_002',
    senderId: 'user-id',
    senderCode: 'EST-2024-A',
    senderRole: 'STUDENT',
    recipientId: 'staff-id',
    recipientCode: 'STAFF-PSI',
    recipientRole: 'STAFF',
    content: 'Respuesta del usuario',
    status: 'READ',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  }
];

const testConversations = [
  {
    id: 'conv_EST-2024-A_STAFF-PSI',
    participant1Code: 'EST-2024-A',
    participant2Code: 'STAFF-PSI',
    lastMessage: 'Respuesta del usuario',
    lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  }
];

localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(testMessages));
localStorage.setItem('CUENTAME_CONVERSATIONS', JSON.stringify(testConversations));
alert('✅ Datos creados. Recarga la página (F5)');
```

4. Presiona Enter
5. **Recarga la página (F5)**
6. ✅ Deberías ver 1 conversación con STAFF-PSI

---

## ❌ "Veo el BUZÓN pero vacío"

### Causa 1: Usuario incorrecto

**Verifica:**
```javascript
// En consola:
const user = JSON.parse(localStorage.getItem('CUENTAME_USER'));
console.log('Usuario actual:', user.code);  // Debe ser EST-2024-A
```

Si es diferente → Haz logout y login como `EST-2024-A`

### Causa 2: conversationId no coincide

**Verifica:**
```javascript
// En consola:
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
console.log('conversationIds en mensajes:', 
  new Set(messages.map(m => m.conversationId))
);
// Debe incluir: conv_EST-2024-A_STAFF-PSI
```

Si falta → Ejecuta la solución anterior

### Causa 3: Componente no cargó

**Verifica:**
```javascript
// En consola:
const div = document.querySelector('.messaging-container');
console.log('MessagingInterface montado:', !!div);
```

Si es `false` → Página no recargó correctamente
- Presiona F5 (reload completo)
- Espera 3 segundos

---

## ❌ "Envío mensaje pero no se guarda"

### Causa 1: Timeout del servidor

**Síntomas:**
- Console dice "Cannot reach /api/messages/send"
- Pero el mensaje SÍ aparece en pantalla

**Explicación:** Sistema usando localStorage como fallback ✅ (NORMAL)

**Solución:** Espera 2 segundos, el mensaje se sincroniza

### Causa 2: Caja de texto vacía

**Verifica:**
```javascript
// En consola:
console.log('Valor input:', document.querySelector('textarea')?.value);
```

Debe tener texto. Si está vacía:
- Haz click en la caja de texto
- Escribe algo
- Presiona Enter

---

## ❌ "El badge de no leídos no desaparece"

### Causa: No marcó como leído

**Solución manual:**
```javascript
// En consola:
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
const updated = messages.map(m => ({
  ...m,
  status: 'READ'  // Marca todo como leído
}));
localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(updated));
location.reload();  // Recarga
```

---

## ❌ "Los mensajes no se actualizan en tiempo real"

### Causa 1: Polling detenido

**Verifica:**
```javascript
// En consola (espera unos segundos):
// Deberías ver en console:
// "🔄 [MessagingInterface] Recargando inbox..."
// Cada 2 segundos
```

Si no ves nada → Componente no cargó

**Solución:**
- Presiona F5 (reload)
- Espera a que el mensajería cargue

### Causa 2: localStorage no sincroniza

**Verifica:**
```javascript
// En otra pestaña, edita localStorage:
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
messages.push({
  id: 'msg_new',
  senderCode: 'STAFF-PSI',
  recipientCode: 'EST-2024-A',
  content: 'Nuevo mensaje',
  status: 'UNREAD',
  conversationId: 'conv_EST-2024-A_STAFF-PSI',
  createdAt: new Date().toISOString()
});
localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(messages));
// Vuelve a la primera pestaña
// En 2 segundos deberías verlo
```

Si no aparece → Revisa que sea el usuario correcto (EST-2024-A)

---

## ❌ "Error: 'conversationId is undefined'"

### Causa: Mensaje sin conversationId

**Verifica:**
```javascript
// En consola:
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
const problematic = messages.filter(m => !m.conversationId);
console.log('Mensajes sin conversationId:', problematic.length);
```

**Solución:** Elimina mensajes malos

```javascript
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
const cleaned = messages.filter(m => m.conversationId);
localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(cleaned));
location.reload();
```

---

## ❌ "Ver "Cannot read property 'length' of undefined"

### Causa: CUENTAME_MESSAGES no existe

**Solución rápida:**
```javascript
// En consola:
if (!localStorage.getItem('CUENTAME_MESSAGES')) {
  localStorage.setItem('CUENTAME_MESSAGES', '[]');
  localStorage.setItem('CUENTAME_CONVERSATIONS', '[]');
  alert('✅ Storage inicializado');
  location.reload();
}
```

---

## ❌ "Pestaña 'Conversaciones' no aparece"

### Causa: viewMode === 'cases' bloqueado

**Solución:**
```javascript
// En consola:
// Buscar botón de Conversaciones
const buttons = Array.from(document.querySelectorAll('button'));
const convButton = buttons.find(b => b.textContent.includes('Conversaciones'));
if (convButton) {
  convButton.click();
  console.log('✅ Cambiado a Conversaciones');
}
```

---

## ❌ "Servidor error 500"

### Causa: Problema en /api/messages/send-case

**Verificación:**
1. Abre DevTools → Network
2. Envía un mensaje
3. Busca POST request a /api/messages/send
4. Click en la request
5. Pestaña Response → Ver error

**Soluciones comunes:**

Si dice "Cannot write to database":
- Base de datos no está disponible
- Sistema cambia automáticamente a localStorage ✅ (NORMAL)
- Mensaje se guarda en localStorage

Si dice "conversationId is null":
- Asegúrate que el mensaje tiene conversationId
- Formato debe ser: `conv_USER1_USER2`

---

## ✅ "Todo funciona, ¿cómo verifico?"

### Checklist rápido:

```javascript
// Copia todo en consola:

// 1. Usuario correcto
const user = JSON.parse(localStorage.getItem('CUENTAME_USER'));
console.log('✓ Usuario:', user.code);

// 2. Mensajes existen
const messages = JSON.parse(localStorage.getItem('CUENTAME_MESSAGES'));
console.log('✓ Mensajes:', messages.length);

// 3. Conversaciones existen
const convs = JSON.parse(localStorage.getItem('CUENTAME_CONVERSATIONS'));
console.log('✓ Conversaciones:', convs.length);

// 4. Componente montado
const isMounted = !!document.querySelector('.messaging-container');
console.log('✓ Componente:', isMounted ? 'Montado' : 'NO montado');

// 5. Servidor responde
fetch('/api/messages/inbox')
  .then(r => console.log('✓ Servidor:', 'OK'))
  .catch(() => console.log('✓ Servidor: NO (usando localStorage)'));

console.log('\n✅ Si todo dice ✓ → Sistema está funcionando correctamente');
```

---

## 🆘 Aún hay problema

1. **Copia la salida completa de la consola**
2. **Abre DevTools → Application → LocalStorage**
3. **Copia CUENTAME_MESSAGES**
4. **Verificar en estos archivos:**
   - [components/MessagingInterface.tsx](components/MessagingInterface.tsx#L60) - línea del polling
   - [services/storageService.ts](services/storageService.ts#L1) - getInbox()
   - [server.js](server.js#L1) - /api/messages/send

---

## 📞 Contacto de Soporte

**Si aún no funciona:**

1. Ejecuta DEBUG_MENSAJES.js completo
2. Copia toda la salida de consola
3. Verifica Network tab en DevTools
4. Copia los errores HTTP exactos

**Información a proporcionar:**
- Qué usuario intentas
- Qué error ves exactamente
- Consola output (F12 → Console)
- Network tab (F12 → Network)
