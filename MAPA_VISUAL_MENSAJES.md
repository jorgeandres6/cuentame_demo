# 🗺️ MAPA VISUAL DEL SISTEMA DE MENSAJES

## 1. FLUJO COMPLETO DE USUARIO

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO FINAL (EST-2024-A)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                    LOGIN
                         │
            ┌────────────▼──────────────┐
            │   Dashboard               │
            │   - Selecciona Mensajes   │
            └────────────┬──────────────┘
                         │
            ┌────────────▼──────────────────┐
            │  MessagingInterface           │
            │  - Carga inbox               │
            │  - Muestra BUZÓN             │
            │  - Polling cada 2s           │
            └────────────┬──────────────────┘
                         │
            ┌────────────▼──────────────────┐
            │  BUZÓN (Conversaciones)      │
            │  - STAFF-PSI: 2 sin leer     │
            │  - Última: "Nos vemos..."    │
            └────────────┬──────────────────┘
                         │
                    Click en conversación
                         │
            ┌────────────▼──────────────────┐
            │  Chat Abierto                │
            │  - Ver 3 mensajes           │
            │  - Escribir respuesta       │
            │  - Enter para enviar        │
            └────────────┬──────────────────┘
                         │
                    Mensaje enviado
                         │
            ┌────────────▼──────────────────┐
            │  localStorage actualiza      │
            │  - Nuevo mensaje guardado   │
            │  - Sync a servidor (async)  │
            └────────────┬──────────────────┘
                         │
            ┌────────────▼──────────────────┐
            │  En 2 segundos               │
            │  - Polling recarga           │
            │  - Se muestra en conversación│
            │  - STAFF lo ve en 2s         │
            └──────────────────────────────┘
```

---

## 2. FLUJO TÉCNICO - STACK

```
FRONTEND LAYER
┌──────────────────────────────────────────┐
│         React (TypeScript)               │
│  components/MessagingInterface.tsx       │
│                                          │
│  1. useEffect() mount                   │
│     └─> loadInbox()                     │
│  2. setInterval(2000)                   │
│     └─> Polling recarga                 │
│  3. onClick(mensaje)                    │
│     └─> handleSendMessage()             │
└──────────────┬───────────────────────────┘
               │
               │  fetch('/api/messages/*')
               │
DATA ACCESS LAYER
┌──────────────┴───────────────────────────┐
│     storageService.ts (TypeScript)       │
│                                          │
│  Intenta server (timeout 3s)            │
│           ↓                              │
│  Si falla → localStorage fallback       │
│                                          │
│  getInbox(userCode)                     │
│  getInboxFromLocalStorage()             │
│  saveMessageToLocalStorage()            │
└──────────────┬───────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
    ✅ BD OK          ❌ BD Fail
      │                 │
      ▼                 ▼
┌─────────────┐  ┌──────────────┐
│ SQL Server  │  │  localStorage│
│             │  │              │
│ Messages    │  │ CUENTAME_*   │
│ Conversat.  │  │ (CRITICAL)   │
└─────────────┘  └──────────────┘
      │                 │
      └────────┬────────┘
               │
         JSON Response
               │
BACKEND LAYER
┌──────────────┴───────────────────────────┐
│      server.js (Node.js/Express)         │
│                                          │
│  POST /api/messages/send                │
│  POST /api/messages/send-case           │
│  GET  /api/messages/inbox               │
│  POST /api/messages/conversation/:code  │
│  GET  /api/messages/by-case/:caseId     │
│  GET  /api/cases/messages/:userCode     │
└──────────────────────────────────────────┘
```

---

## 3. ESTRUCTURAS DE DATOS

```
┌─────────────────────────────────────┐
│      localStorage                   │
├─────────────────────────────────────┤
│                                     │
│  CUENTAME_USER                      │
│  {                                  │
│    code: "EST-2024-A"              │ ← CRÍTICO
│    id: "user-id"                   │
│    role: "STUDENT"                 │
│  }                                  │
│                                     │
│  CUENTAME_MESSAGES                  │
│  [                                  │
│    {                                │
│      id: "msg_001"                 │
│      senderCode: "STAFF-PSI"       │
│      recipientCode: "EST-2024-A"   │ ← Filtro
│      conversationId: "conv_..."    │ ← Agrupación
│      content: "..."                │
│      status: "UNREAD"              │ ← Badge
│      createdAt: "2024-10-15T..."   │
│    }                                │
│  ]                                  │
│                                     │
│  CUENTAME_CONVERSATIONS             │
│  [                                  │
│    {                                │
│      id: "conv_EST-2024-A_STAFF-PSI"│ ← ID único
│      participant1Code: "EST-2024-A" │
│      participant2Code: "STAFF-PSI"  │
│      lastMessage: "..."             │
│      lastMessageAt: "2024-10-15"   │
│      updatedAt: "2024-10-15"       │
│    }                                │
│  ]                                  │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. RENDERIZADO EN PANTALLA

```
┌─────────────────────────────────────────┐
│           SIDEBAR (Izquierda)           │
├─────────────────────────────────────────┤
│                                         │
│  💬 Mensajes (2)                       │
│  [📋 Casos] [👥 Conversaciones]       │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ 👤 STAFF-PSI            [2]    │◄─┼─ Badge (unread)
│  │ Nos vemos mañana a las...      │  │
│  │ 3 mensajes • Oct 15           │  │
│  └─────────────────────────────────┘  │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ 👤 ADMIN-GENERAL               │  │
│  │ (conversación vacía)           │  │
│  └─────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      CHAT AREA (Derecha)                │
├─────────────────────────────────────────┤
│                                         │
│  Conversación con STAFF-PSI   [X]      │
│  ═════════════════════════════════════ │
│                                         │
│  👤 STAFF-PSI  15:30                   │
│  Hola, recibí tu reporte...           │
│  [●] UNREAD                            │
│                                         │
│  👤 EST-2024-A  16:15                  │
│  Gracias por contactarme              │
│  [✓] READ                              │
│                                         │
│  👤 STAFF-PSI  16:45                   │
│  Nos vemos mañana a las 2 PM          │
│  [●] UNREAD                            │
│                                         │
│  ─────────────────────────────────────│
│  [Escribe mensaje...]        [Enviar] │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. CICLO DE ACTUALIZACIÓN

```
                INICIO
                  │
        ┌─────────▼────────────┐
        │ MessagingInterface   │
        │ montado              │
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐
        │ loadInbox()          │
        │ - fetch /api/inbox   │ (3s timeout)
        │ - parseArray         │
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐        ┌──────────────┐
        │ Fallback            │───────▶ │ localStorage │
        │ (si servidor falla) │        └──────────────┘
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐
        │ filterByRecipient    │
        │ recipientCode === me │
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐
        │ groupByConversation  │
        │ { conversationId: [] }
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐
        │ setState(messagesByCase)
        │ React re-renders    │
        └─────────┬────────────┘
                  │
        ┌─────────▼────────────┐
        │ Muestra BUZÓN       │
        │ - Conversaciones    │
        │ - Badges            │
        │ - Preview           │
        └─────────┬────────────┘
                  │
         Espera 2 segundos
                  │
        ┌─────────▼────────────┐
        │ setInterval(2000)    │
        │ Repite desde loadInbox
        └─────────────────────┘
```

---

## 6. FLUJO DE ENVÍO DE MENSAJE

```
Usuario escribe: "Hola STAFF"
    │
    ▼
handleSendMessage()
    │
    ├─ Validar no vacío ✓
    │
    ├─ Crear objeto Message:
    │  {
    │    id: uuid(),
    │    senderCode: 'EST-2024-A',
    │    recipientCode: 'STAFF-PSI',
    │    content: 'Hola STAFF',
    │    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    │    status: 'UNREAD',
    │    createdAt: now()
    │  }
    │
    ├─ storageService.sendMessage()
    │
    ├─ saveMessageToLocalStorage()
    │  (INMEDIATO - no espera)
    │
    ├─ fetch POST /api/messages/send
    │  (async, 3s timeout)
    │
    ├─ setNewMessage('') - limpia
    │
    ├─ Mensaje visible en 2s máximo
    │  (polling recarga en next ciclo)
    │
    ▼
STAFF ve el mensaje en su BUZÓN
```

---

## 7. DECISIÓN: BD vs localStorage

```
fetch /api/messages/inbox

    │
    ├─ 200 OK ✓        ├─ Timeout/Error ✗
    │                  │
    ▼                  ▼
Parsing JSON     Fallback a
    │            localStorage
    ▼                  │
Retorna datos    ▼
                 getInboxFromLocalStorage()
                 │
                 ├─ Leer CUENTAME_MESSAGES
                 │
                 ├─ Filter: recipientCode === userCode
                 │
                 ▼
                 Retorna array
    │                  │
    └────────┬─────────┘
             │
        Presentar en UI
             │
       (Sin diferencia para usuario)
```

---

## 8. ARQUITECTURA DE CARPETAS

```
cuentame_demo/
│
├─ components/
│  └─ MessagingInterface.tsx    ◄─ UI Principal
│
├─ services/
│  └─ storageService.ts          ◄─ API + localStorage
│
├─ server.js                      ◄─ Backend endpoints
│
├─ types.ts                       ◄─ Interfaces TS
│
├─ DOCUMENTACION/
│  ├─ SISTEMA_MENSAJES_COMPLETO.md
│  ├─ INSTRUCCIONES_TESTING_MENSAJES.md
│  ├─ VERIFICACION_SISTEMA_MENSAJES.md
│  ├─ TROUBLESHOOTING_MENSAJES.md
│  ├─ DEBUG_MENSAJES.js
│  ├─ INDICE_MENSAJES.md
│  └─ RESUMEN_EJECUTIVO_MENSAJES.md  ◄─ Este
│
└─ package.json                   ◄─ Dependencies
```

---

## 9. TIMELINE: RECEPCIÓN DE MENSAJE

```
T+0:00   STAFF envía mensaje
         POST /api/messages/send-case
         
T+0:10   Backend guarda en BD/localStorage
         Actualiza CONVERSATIONS
         
T+0:15   Usuario sigue en BUZÓN
         Sin saber que hay mensaje nuevo

T+1:50   (Esperando siguiente polling)

T+2:00   ⏱️ Polling dispara
         loadInbox() ejecuta
         fetch /api/messages/inbox
         
T+2:10   Respuesta llega
         Mensajes parseados
         
T+2:20   setState(messagesByCase)
         React re-renderiza
         
T+2:30   ✨ USUARIO VE NUEVO MENSAJE
         Badge actualizado
         Conversación resaltada

TOTAL: 0-2.3 segundos desde que STAFF envía
```

---

## 10. MATRIZ DE COMPATIBILIDAD

| Escenario | BD OK | BD FALLA | Estado |
|-----------|-------|----------|--------|
| Ver mensajes | ✅ | ✅ | Funciona |
| Enviar mensaje | ✅ | ✅ | Funciona |
| Actualizar tiempo real | ✅ | ✅ | Funciona |
| CONVERSATIONS sync | ✅ | ✅ | Funciona |
| Persistencia | ✅ | ⚠️ (localStorage) | Funciona |

---

## 11. PUNTOS CRÍTICOS

```
┌──────────────────────────────────────┐
│ PUNTO 1: conversationId             │
│ Format: conv_USER1_USER2             │
│ Crítico para: Agrupación            │
│ Falla aquí → No agrupa              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ PUNTO 2: recipientCode              │
│ Filtro: recipientCode === userCode   │
│ Crítico para: Ver solo mis mensajes │
│ Falla aquí → Ve mensajes ajenos     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ PUNTO 3: status                      │
│ Valores: 'READ' | 'UNREAD'           │
│ Crítico para: Badge de no leídos     │
│ Falla aquí → No se ven badges       │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ PUNTO 4: createdAt                   │
│ Formato: ISO timestamp               │
│ Crítico para: Ordenamiento           │
│ Falla aquí → Mensajes desordenados  │
└──────────────────────────────────────┘
```

---

## 12. CHECKLIST DE VERIFICACIÓN

```
┌─ FRONTEND
│  ├─ ✅ MessagingInterface montado
│  ├─ ✅ useEffect() ejecutado
│  ├─ ✅ loadInbox() llamado
│  ├─ ✅ Polling cada 2s activo
│  ├─ ✅ BUZÓN visible (conversaciones)
│  └─ ✅ Badges de no leídos aparecen
│
├─ DATA LAYER
│  ├─ ✅ CUENTAME_MESSAGES en localStorage
│  ├─ ✅ CUENTAME_CONVERSATIONS en localStorage
│  ├─ ✅ Fallback funcionando
│  ├─ ✅ Timeout en 3 segundos
│  └─ ✅ conversationId formato correcto
│
├─ BACKEND
│  ├─ ✅ /api/messages/inbox disponible
│  ├─ ✅ /api/messages/send-case disponible
│  ├─ ✅ CONVERSATIONS table actualiza
│  ├─ ✅ Timeout handling
│  └─ ✅ Error logging
│
└─ USUARIO EXPERIENCE
   ├─ ✅ Ver mensajes sin recargar
   ├─ ✅ Enviar mensaje instantáneamente
   ├─ ✅ Actualización cada 2 segundos
   ├─ ✅ Interfaz intuitiva
   └─ ✅ Sin errores en consola
```

---

**Este mapa visual es tu guía de referencia rápida del sistema completo.**

Usa [INDICE_MENSAJES.md](INDICE_MENSAJES.md) para navegar a documentación detallada.
