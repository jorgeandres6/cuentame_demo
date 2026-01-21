// Script para crear mensajes de prueba en localStorage
// Abre la consola del navegador y ejecuta este script

const testMessages = [
  {
    id: 'msg_001',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: 'Hola, recibí tu reporte sobre el conflicto. Quiero entender mejor la situación. ¿Puedes describir qué pasó?',
    status: 'UNREAD',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 3600000).toISOString() // Hace 1 hora
  },
  {
    id: 'msg_002',
    senderId: 'user-id',
    senderCode: 'EST-2024-A',
    senderRole: 'STUDENT',
    recipientId: 'staff-id',
    recipientCode: 'STAFF-PSI',
    recipientRole: 'STAFF',
    content: 'Hola, gracias por contactarme. El conflicto fue en el recreo con un compañero.',
    status: 'READ',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 1800000).toISOString() // Hace 30 min
  },
  {
    id: 'msg_003',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: '¿Recuerdas exactamente qué desencadenó la discusión? Esto es importante para entender el contexto.',
    status: 'UNREAD',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 900000).toISOString() // Hace 15 min
  },
  {
    id: 'msg_004',
    senderId: 'staff-id',
    senderCode: 'STAFF-PSI',
    senderRole: 'STAFF',
    recipientId: 'user-id',
    recipientCode: 'EST-2024-A',
    recipientRole: 'STUDENT',
    content: 'También quería informarte que necesitamos que atiendas a la orientadora mañana a las 2 PM. ¿Te viene bien?',
    status: 'UNREAD',
    messageType: 'TEXT',
    conversationId: 'conv_EST-2024-A_STAFF-PSI',
    caseId: null,
    createdAt: new Date(Date.now() - 300000).toISOString() // Hace 5 min
  }
];

// 🔧 NUEVO: Crear conversación
const testConversations = [
  {
    id: 'conv_EST-2024-A_STAFF-PSI',
    participant1Code: 'EST-2024-A',
    participant2Code: 'STAFF-PSI',
    lastMessage: 'También quería informarte que necesitamos que atiendas a la orientadora mañana a las 2 PM. ¿Te viene bien?',
    lastMessageAt: new Date(Date.now() - 300000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString()
  }
];

// Guardar en localStorage
localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(testMessages));
localStorage.setItem('CUENTAME_CONVERSATIONS', JSON.stringify(testConversations));
console.log('✅ Mensajes y conversaciones de prueba guardados en localStorage');
console.log('Total mensajes:', testMessages.length);
console.log('Total conversaciones:', testConversations.length);
testMessages.forEach(msg => {
  console.log(`- ${msg.senderCode} → ${msg.recipientCode}: "${msg.content.substring(0, 50)}..."`);
});
