# 📬 Instrucciones para Probar el Sistema de Mensajes

## Flujo Completo de Mensajes

### **1. Preparación Inicial**

Ejecuta estos pasos UNA SOLA VEZ para preparar los datos de prueba:

#### **Paso 1: Abre la consola del navegador (F12)**

#### **Paso 2: Copia y ejecuta este script en la consola:**

```javascript
// Script para crear datos de prueba en localStorage
const testMessages = [
  {
    id: 'msg_001',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: 'Hola, recibí tu reporte. ¿Cómo estás?',
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
    content: 'Hola, gracias por contactarme.',
    status: 'READ',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'msg_003',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: 'Nos vemos mañana a las 2 PM.',
    status: 'UNREAD',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 300000).toISOString()
  }
];

const testConversations = [
  {
    id: 'conv_EST-2024-A_STAFF-PSI',
    participant1Code: 'EST-2024-A',
    participant2Code: 'STAFF-PSI',
    lastMessage: 'Nos vemos mañana a las 2 PM.',
    lastMessageAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString()
  }
];

localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(testMessages));
localStorage.setItem('CUENTAME_CONVERSATIONS', JSON.stringify(testConversations));
console.log('✅ Datos de prueba guardados correctamente');
console.log('📊 Mensajes:', testMessages.length);
console.log('💬 Conversaciones:', testConversations.length);
```

---

### **2. Cómo Probar el Sistema**

#### **Escenario 1: Ver Mensajes en el Buzón**

1. **Inicia sesión como estudiante:**
   - Usuario: `EST-2024-A`
   - Contraseña: `123`

2. **Ve al módulo de Mensajes**
   - Deberías ver el BUZÓN (pestaña 👥 Conversaciones)
   - Verás una conversación con **STAFF-PSI**
   - Mostará `2 sin leer` (badge rojo)

3. **Haz click en la conversación**
   - Se abre el historial completo
   - Verás los 3 mensajes en orden cronológico
   - Los mensajes no leídos tendrán un indicador ●

4. **Responde un mensaje**
   - Escribe un mensaje en la caja de texto
   - Presiona Enter o click en botón enviar
   - El mensaje aparecerá inmediatamente
   - Se guardará en localStorage

---

#### **Escenario 2: Enviar Mensaje desde STAFF**

1. **Abre CaseDetail como STAFF**
   - Usuario: `STAFF-PSI`
   - Accede a un caso

2. **Envía un mensaje a un usuario**
   - Escribe en la sección "Mensaje directo"
   - El mensaje se guarda y actualiza CONVERSATIONS

3. **Verifica como estudiante**
   - Cierra sesión del STAFF
   - Inicia como `EST-2024-A`
   - El nuevo mensaje aparecerá en el BUZÓN

---

### **3. Estructura de Datos**

#### **CUENTAME_MESSAGES (localStorage)**
```json
{
  "id": "msg_001",
  "senderCode": "STAFF-PSI",
  "recipientCode": "EST-2024-A",
  "content": "Contenido...",
  "conversationId": "conv_EST-2024-A_STAFF-PSI",
  "caseId": null,
  "status": "UNREAD",
  "createdAt": "ISO timestamp"
}
```

#### **CUENTAME_CONVERSATIONS (localStorage)**
```json
{
  "id": "conv_EST-2024-A_STAFF-PSI",
  "participant1Code": "EST-2024-A",
  "participant2Code": "STAFF-PSI",
  "lastMessage": "...",
  "lastMessageAt": "ISO timestamp",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

---

### **4. Flujo de Recarga (Tiempo Real)**

- **Cada 2 segundos:** El sistema recarga el inbox automáticamente
- **Sincronización:** Los cambios en localStorage se reflejan inmediatamente
- **Sin BD:** Funciona completamente offline con localStorage

---

### **5. Troubleshooting**

| Problema | Solución |
|----------|----------|
| No veo mensajes | Ejecuta el script de datos de prueba en consola |
| Mensajes no se actualizan | Recarga la página (F5) |
| Conversación vacía | Verifica que conversationId coincida |
| Badge de no leídos no desaparece | Cierra y abre la conversación |
| Error en consola | Abre DevTools (F12) → Console → revisa errores |

---

### **6. Notas Importantes**

✅ **El sistema funciona sin BD** (usando localStorage)
✅ **Los cambios se guardan automáticamente**
✅ **Se recarga cada 2 segundos (tiempo real)**
✅ **Soporta múltiples conversaciones simultáneas**
❌ **Los datos se pierden si se limpia localStorage**

---

### **7. Limpiar Datos de Prueba**

Para empezar de cero:

```javascript
localStorage.removeItem('CUENTAME_MESSAGES');
localStorage.removeItem('CUENTAME_CONVERSATIONS');
console.log('✅ Datos limpios. El buzón estará vacío.');
```

---

## ✅ El Sistema Está Listo

Todos los componentes están configurados para:
- ✅ Cargar mensajes al iniciar sesión
- ✅ Mostrar conversaciones en BUZÓN
- ✅ Actualizar en tiempo real (cada 2 segundos)
- ✅ Funcionar con o sin BD
- ✅ Guardar mensajes automáticamente
