# Fix: Mensajes de STAFF No Aparecen en el Buzón de Usuarios

## Problema
✅ Los mensajes enviados por STAFF se guardan correctamente en la tabla `MESSAGES`
❌ Pero NO aparecen en el buzón de mensajes de los usuarios

## Causa Raíz

El componente `MessagingInterface` obtenía los mensajes de dos formas:
1. **Endpoint `/api/messages/inbox`** - Solo retorna mensajes donde `recipientCode = usuarioActual`
2. **Variable local `messagesByCase`** - Se agrupaba del inbox

**Cuando STAFF envía un mensaje:**
- Se guarda en la BD con `senderCode = STAFF` y `recipientCode = usuario`
- El endpoint `/api/messages/inbox` correctamente lo retorna al usuario
- Pero la UI NO mostraba los casos hasta que se hacía clic en ellos

## Soluciones Implementadas

### 1. **Nueva Función: `getUserCasesWithMessages()`** 
Ubicación: [`services/storageService.ts`](services/storageService.ts#L644)

```typescript
export const getUserCasesWithMessages = async (userCode: string): Promise<...> 
```

**Qué hace:**
- Obtiene todos los casos del usuario desde `/api/cases/user/:code`
- Para cada caso, obtiene sus mensajes desde `/api/messages/by-case/:caseId`
- Retorna un objeto con estructura: `{ [caseId]: { caseInfo, messages } }`

**Por qué es necesario:**
- Asegura que se muestren TODOS los casos, no solo aquellos donde hay mensajes en el inbox
- Funciona independientemente del rol del remitente/recipiente

### 2. **Actualización: `loadCaseConversation()`**
Ubicación: [`components/MessagingInterface.tsx`](components/MessagingInterface.tsx#L83)

```diff
- const caseMessages = messagesByCase[caseId] || [];
+ const caseMessages = await getMessagesByCase(caseId);
```

**Cambio:**
- Ahora obtiene los mensajes del caso directamente desde la BD
- No depende del inbox filtrado por recipiente
- Garantiza que ve TODOS los mensajes del caso

### 3. **Mejora: `loadInbox()`**
Ubicación: [`components/MessagingInterface.tsx`](components/MessagingInterface.tsx#L71)

```typescript
const loadInbox = async () => {
  // Cargar inbox tradicional
  const messages = await getInbox(userCode);
  
  // 🔧 NUEVO: También cargar casos con sus mensajes
  const casesWithMessages = await getUserCasesWithMessages(userCode);
  setMessagesByCase(allCaseMessages);
}
```

**Beneficio:**
- Ahora el listado de casos se actualiza cada 5 segundos automáticamente
- Incluye casos incluso si no hay mensajes nuevos en el inbox

## Flujo de Funcionamiento

### Cuando STAFF envía un mensaje a un usuario:

1. **STAFF usa `CaseDetail.tsx`**
   ```typescript
   await sendMessageWithCase(caseId, recipientCode, content, staffCode)
   ```
   → Llama a POST `/api/messages/send-case`
   → Guarda en BD con `caseId` y `conversationId = caseId`

2. **Usuario abre `MessagingInterface.tsx`**
   → `loadInbox()` se ejecuta cada 5 segundos
   → Obtiene casos desde `/api/cases/user/:userCode`
   → Obtiene mensajes desde `/api/messages/by-case/:caseId`
   → Actualiza `messagesByCase`

3. **Usuario hace clic en un caso**
   → `loadCaseConversation(caseId)` llama a `getMessagesByCase(caseId)`
   → Obtiene TODOS los mensajes del caso
   → Muestra la conversación completa

## Validación

✅ **Endpoint `/api/messages/inbox`** funciona correctamente
  - Retorna mensajes donde `recipientCode = usuario`
  - SQL: `WHERE recipientCode = @code AND status != 'DELETED'`

✅ **Endpoint `/api/messages/by-case/:caseId`** funciona correctamente
  - Retorna TODOS los mensajes de un caso
  - SQL: `WHERE caseId = @caseId`

✅ **Endpoint `/api/cases/user/:code`** funciona correctamente
  - Retorna casos del usuario

## Archivos Modificados

1. [`services/storageService.ts`](services/storageService.ts)
   - Agregada: `getUserCasesWithMessages()`
   - Existente: `getMessagesByCase()` ✓
   - Existente: `sendMessageWithCase()` ✓

2. [`components/MessagingInterface.tsx`](components/MessagingInterface.tsx)
   - Agregado import: `getUserCasesWithMessages`
   - Actualizado: `loadCaseConversation()` para usar `getMessagesByCase()`
   - Actualizado: `loadInbox()` para cargar casos con mensajes
   - Existente: Auto-reload cada 5 segundos ✓

## Próximos Pasos (Opcional)

- Agregar refrescado en tiempo real con WebSockets
- Mostrar indicador visual cuando hay nuevos mensajes
- Actualizar la lista de casos sin recargar la conversación abierta
