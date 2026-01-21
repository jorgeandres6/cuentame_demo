// 🔍 Script de Debugging para Sistema de Mensajes
// Copia y pega TODO ESTO en la consola del navegador (F12 → Console)

console.log('🔍 INICIANDO DEBUGGING DEL SISTEMA DE MENSAJES...\n');

// 1️⃣ VERIFICAR USUARIO LOGUEADO
console.log('📋 1. USUARIO ACTUAL:');
const userString = localStorage.getItem('CUENTAME_USER');
if (userString) {
  try {
    const user = JSON.parse(userString);
    console.log('   ✅ Usuario:', user.code || user.userCode);
    console.log('   ID:', user.id || user.userId);
    console.log('   Rol:', user.role || user.userRole);
  } catch (e) {
    console.error('   ❌ Error parsing user:', e);
  }
} else {
  console.log('   ❌ No hay usuario logueado');
}

// 2️⃣ VERIFICAR MENSAJES EN LOCALSTORAGE
console.log('\n📬 2. MENSAJES EN LOCALSTORAGE:');
const messagesString = localStorage.getItem('CUENTAME_MESSAGES');
if (messagesString) {
  try {
    const messages = JSON.parse(messagesString);
    console.log(`   ✅ Total de mensajes: ${messages.length}`);
    
    if (userString) {
      const user = JSON.parse(userString);
      const userCode = user.code || user.userCode;
      
      // Filtrar mensajes para este usuario
      const inboxMessages = messages.filter(m => m.recipientCode === userCode);
      console.log(`   📥 Mensajes en inbox: ${inboxMessages.length}`);
      
      // Agrupar por conversación
      const byConversation = {};
      inboxMessages.forEach(msg => {
        if (!byConversation[msg.conversationId]) {
          byConversation[msg.conversationId] = [];
        }
        byConversation[msg.conversationId].push(msg);
      });
      
      console.log(`   💬 Conversaciones únicas: ${Object.keys(byConversation).length}`);
      Object.entries(byConversation).forEach(([convId, msgs]) => {
        const unread = msgs.filter(m => m.status === 'UNREAD').length;
        console.log(`      - ${convId}: ${msgs.length} mensajes (${unread} sin leer)`);
      });
    }
    
    // Mostrar últimos 2 mensajes
    console.log('\n   📧 Últimos 2 mensajes:');
    messages.slice(-2).forEach(msg => {
      console.log(`      [${msg.createdAt}] ${msg.senderCode}: ${msg.content.substring(0, 50)}...`);
    });
  } catch (e) {
    console.error('   ❌ Error parsing messages:', e);
  }
} else {
  console.log('   ❌ No hay mensajes en localStorage');
}

// 3️⃣ VERIFICAR CONVERSACIONES EN LOCALSTORAGE
console.log('\n💬 3. CONVERSACIONES EN LOCALSTORAGE:');
const conversationsString = localStorage.getItem('CUENTAME_CONVERSATIONS');
if (conversationsString) {
  try {
    const conversations = JSON.parse(conversationsString);
    console.log(`   ✅ Total de conversaciones: ${conversations.length}`);
    conversations.forEach(conv => {
      console.log(`      - ${conv.id}`);
      console.log(`        Último mensaje: ${conv.lastMessage}`);
      console.log(`        Actualizado: ${conv.updatedAt}`);
    });
  } catch (e) {
    console.error('   ❌ Error parsing conversations:', e);
  }
} else {
  console.log('   ❌ No hay conversaciones en localStorage');
}

// 4️⃣ VERIFICAR CONEXIÓN AL SERVIDOR
console.log('\n🌐 4. CONECTIVIDAD AL SERVIDOR:');
fetch('/api/messages/inbox', {
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(res => {
    console.log(`   ✅ Servidor responde: Status ${res.status}`);
    return res.json();
  })
  .then(data => {
    console.log(`   📊 Mensajes desde servidor: ${data.length || 0}`);
  })
  .catch(err => {
    console.log(`   ⚠️ Servidor no disponible: ${err.message}`);
    console.log(`   → Sistema usando localStorage como fallback`);
  });

// 5️⃣ VERIFICAR COMPONENTE REACT
console.log('\n⚛️ 5. COMPONENTE REACT:');
setTimeout(() => {
  const messagingDiv = document.querySelector('[data-testid="messaging-interface"]');
  if (messagingDiv) {
    console.log('   ✅ MessagingInterface montado');
  } else {
    console.log('   ⚠️ MessagingInterface aún no montado o no tiene data-testid');
  }
  
  // Buscar por clase
  const messagingByClass = document.querySelector('.messaging-interface');
  if (messagingByClass) {
    console.log('   ✅ Encontrado por clase .messaging-interface');
  }
  
  // Buscar conversaciones en DOM
  const conversations = document.querySelectorAll('[data-conversation-id]');
  console.log(`   💬 Conversaciones en DOM: ${conversations.length}`);
}, 100);

// 6️⃣ VERIFICAR LOGS DE CONSOLA DEL SERVIDOR
console.log('\n📡 6. PRUEBA DE ENVÍO DE MENSAJE:');
console.log('   Para probar envío, ejecuta:');
console.log(`
   fetch('/api/messages/send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       senderCode: 'EST-2024-A',
       recipientCode: 'STAFF-PSI',
       content: 'Test message',
       conversationId: 'conv_EST-2024-A_STAFF-PSI'
     })
   }).then(r => r.json()).then(d => console.log(d));
`);

// 7️⃣ FUNCIÓN HELPER: CREAR DATOS DE PRUEBA
console.log('\n🧪 7. CREAR DATOS DE PRUEBA:');
console.log('   Ejecuta: crearDatosTest()');

window.crearDatosTest = function() {
  const messages = [
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
    }
  ];

  const conversations = [
    {
      id: 'conv_EST-2024-A_STAFF-PSI',
      participant1Code: 'EST-2024-A',
      participant2Code: 'STAFF-PSI',
      lastMessage: 'Gracias por contactarme.',
      lastMessageAt: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString()
    }
  ];

  localStorage.setItem('CUENTAME_MESSAGES', JSON.stringify(messages));
  localStorage.setItem('CUENTAME_CONVERSATIONS', JSON.stringify(conversations));
  
  console.log('✅ Datos de prueba creados!');
  console.log(`   Mensajes: ${messages.length}`);
  console.log(`   Conversaciones: ${conversations.length}`);
  console.log('   Recarga la página (F5) para ver los cambios');
};

// 8️⃣ RESUMEN FINAL
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DEL DEBUGGING:');
console.log('='.repeat(60));
console.log('✅ Sistema de Debugging Activado');
console.log('\n📋 Próximos pasos:');
console.log('1. Abre DevTools (F12)');
console.log('2. Ve a la pestaña "Network" para ver llamadas API');
console.log('3. Ve a "Application" → "LocalStorage" para ver datos');
console.log('4. Si no hay mensajes, ejecuta: crearDatosTest()');
console.log('5. Recarga la página (F5)');
console.log('6. Verifica que aparezcan en el BUZÓN');
console.log('\n🆘 Si encuentras errores, copialos de la consola!');
console.log('='.repeat(60) + '\n');
