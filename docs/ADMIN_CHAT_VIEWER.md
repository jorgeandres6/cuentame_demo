# 👥 Guía: Visualizar Historiales de Chats (Para Administrador)

## Descripción
Esta guía muestra cómo implementar un panel donde administradores puedan ver y analizar los historiales de chats de los usuarios.

## 🎯 Caso de Uso
El equipo psicosocial quiere revisar las conversaciones completas de usuarios para:
- Entender mejor los patrones de conflicto
- Realizar seguimiento más efectivo
- Identificar usuarios en riesgo
- Validar las clasificaciones automáticas

## 🔌 Endpoints Disponibles

### Obtener Todos los Chats de un Usuario
```bash
GET /api/chats/EST-2024-A
```

### Obtener Detalles Completos de un Chat
```bash
GET /api/chats/chat_1234567890/messages
```

## 📝 Implementación en Dashboard.tsx

### 1. Agregar Sección de Historiales

```typescript
// En Dashboard.tsx
interface ChatPreview {
  id: string;
  topic: string;
  messageCount: number;
  createdAt: string;
  status: 'ACTIVE' | 'ARCHIVED';
  associatedCaseId?: string;
}

const [userChats, setUserChats] = useState<ChatPreview[]>([]);
const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);

useEffect(() => {
  const loadUserChats = async () => {
    const chats = await getChats(user.encryptedCode);
    const previews = chats.map(chat => ({
      id: chat.id,
      topic: chat.topic,
      messageCount: chat.messages.length,
      createdAt: new Date(chat.createdAt).toLocaleDateString('es-ES'),
      status: chat.status,
      associatedCaseId: chat.caseId
    }));
    setUserChats(previews);
  };
  loadUserChats();
}, [user.encryptedCode]);
```

### 2. Componente para Listar Chats

```typescript
const ChatListPanel: React.FC<{ 
  chats: ChatPreview[]; 
  onSelectChat: (chatId: string) => void;
}> = ({ chats, onSelectChat }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Historiales de Chat</h3>
      
      {chats.length === 0 ? (
        <p className="text-gray-500">No hay chats registrados</p>
      ) : (
        <div className="space-y-3">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className="w-full text-left p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{chat.topic}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {chat.messageCount} mensajes • {chat.createdAt}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  chat.status === 'ARCHIVED' 
                    ? 'bg-green-200 text-green-800' 
                    : 'bg-blue-200 text-blue-800'
                }`}>
                  {chat.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. Componente para Ver Detalles del Chat

```typescript
const ChatDetailView: React.FC<{ 
  chat: ChatConversation;
}> = ({ chat }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">{chat.topic}</h3>
      
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>ID del Chat:</strong> {chat.id}
        </p>
        {chat.caseId && (
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Caso Asociado:</strong> {chat.caseId}
          </p>
        )}
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <strong>Creado:</strong> {new Date(chat.createdAt).toLocaleString('es-ES')}
        </p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {chat.messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-indigo-100 dark:bg-indigo-900 ml-8'
                : 'bg-gray-100 dark:bg-gray-700 mr-8'
            }`}
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              <strong>{msg.role === 'user' ? 'Usuario' : 'Asistente'}</strong>
              {' • '}
              {new Date(msg.timestamp).toLocaleTimeString('es-ES')}
            </p>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Integración Completa en Dashboard

```typescript
const Dashboard: React.FC = () => {
  // ... código existente ...
  const [userChats, setUserChats] = useState<ChatPreview[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedChatDetail, setSelectedChatDetail] = useState<ChatConversation | null>(null);

  useEffect(() => {
    const loadChats = async () => {
      const chats = await getChats(currentUser.encryptedCode);
      setUserChats(chats.map(chat => ({
        id: chat.id,
        topic: chat.topic,
        messageCount: chat.messages.length,
        createdAt: new Date(chat.createdAt).toLocaleDateString('es-ES'),
        status: chat.status,
        associatedCaseId: chat.caseId
      })));
    };
    loadChats();
  }, [currentUser]);

  const handleSelectChat = async (chatId: string) => {
    const messages = await getChatMessages(chatId);
    const chat = userChats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChatDetail({
        id: chatId,
        topic: chat.topic,
        encryptedUserCode: currentUser.encryptedCode,
        messages: messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: chat.status as 'ACTIVE' | 'ARCHIVED',
        caseId: chat.associatedCaseId
      });
      setSelectedChatId(chatId);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <ChatListPanel chats={userChats} onSelectChat={handleSelectChat} />
      
      {selectedChatDetail && (
        <ChatDetailView chat={selectedChatDetail} />
      )}
    </div>
  );
};
```

## 📊 Vista para Personal de Direccion (Análisis)

```typescript
const ChatAnalyticsPanel: React.FC<{ chats: ChatConversation[] }> = ({ chats }) => {
  const stats = {
    totalChats: chats.length,
    activeChats: chats.filter(c => c.status === 'ACTIVE').length,
    archivedChats: chats.filter(c => c.status === 'ARCHIVED').length,
    totalMessages: chats.reduce((sum, c) => sum + c.messages.length, 0),
    averageMessagesPerChat: Math.round(
      chats.reduce((sum, c) => sum + c.messages.length, 0) / chats.length
    ),
    averageChatDuration: Math.round(
      chats.reduce((sum, c) => {
        const start = new Date(c.createdAt).getTime();
        const end = new Date(c.updatedAt).getTime();
        return sum + (end - start);
      }, 0) / chats.length / 1000 / 60
    ) // en minutos
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard 
        label="Chats Totales" 
        value={stats.totalChats} 
        color="blue"
      />
      <StatCard 
        label="Chats Activos" 
        value={stats.activeChats} 
        color="green"
      />
      <StatCard 
        label="Chats Archivados" 
        value={stats.archivedChats} 
        color="yellow"
      />
      <StatCard 
        label="Mensajes Totales" 
        value={stats.totalMessages} 
        color="purple"
      />
      <StatCard 
        label="Promedio de Mensajes" 
        value={stats.averageMessagesPerChat} 
        color="indigo"
      />
      <StatCard 
        label="Duración Promedio (min)" 
        value={stats.averageChatDuration} 
        color="cyan"
      />
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    cyan: 'bg-cyan-100 text-cyan-800'
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
};
```

## 📥 Exportar Chat a JSON

```typescript
const exportChatAsJSON = (chat: ChatConversation) => {
  const dataStr = JSON.stringify(chat, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat_${chat.id}.json`;
  link.click();
};

const exportChatAsCSV = (chat: ChatConversation) => {
  let csv = 'Rol,Contenido,Marca de Tiempo\n';
  
  chat.messages.forEach(msg => {
    const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
    const content = `"${msg.content.replace(/"/g, '""')}"`;
    const timestamp = new Date(msg.timestamp).toLocaleString('es-ES');
    csv += `${role},${content},${timestamp}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat_${chat.id}.csv`;
  link.click();
};
```

## 🔍 Búsqueda y Filtrado de Chats

```typescript
const searchChats = (chats: ChatConversation[], query: string): ChatConversation[] => {
  const lowerQuery = query.toLowerCase();
  return chats.filter(chat =>
    chat.topic.toLowerCase().includes(lowerQuery) ||
    chat.messages.some(msg =>
      msg.content.toLowerCase().includes(lowerQuery)
    )
  );
};

const filterChatsByStatus = (
  chats: ChatConversation[], 
  status: 'ACTIVE' | 'ARCHIVED'
): ChatConversation[] => {
  return chats.filter(chat => chat.status === status);
};

const filterChatsByDateRange = (
  chats: ChatConversation[], 
  startDate: Date, 
  endDate: Date
): ChatConversation[] => {
  return chats.filter(chat => {
    const chatDate = new Date(chat.createdAt);
    return chatDate >= startDate && chatDate <= endDate;
  });
};
```

## 🚀 Próximas Mejoras

1. **Búsqueda Global** - Buscar en todos los chats de todos los usuarios
2. **Reportes Automáticos** - Generar reportes diarios/semanales
3. **Alertas Inteligentes** - Notificar si se detectan palabras clave
4. **Análisis de Sentimientos** - Evaluar tono de la conversación
5. **Transcripciones Mejoradas** - Exportar con formato profesional
6. **Comparación de Chats** - Analizar patrones entre usuarios

---

**Nota:** La privacidad está garantizada porque solo se muestra `encryptedCode` en lugar de nombres reales.
