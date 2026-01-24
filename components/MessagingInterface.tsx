import React, { useState, useEffect, useRef } from 'react';
import { 
  sendMessage, 
  getInbox, 
  getConversation, 
  getUnreadCount, 
  markAsRead,
  groupMessagesByCase,
  getLastMessageByCase,
  getMessagesByCase,
  getUserCasesWithMessages
} from '../services/storageService';
import { Message, UserRole } from '../types';

interface MessagingInterfaceProps {
  userCode: string;
  userRole: UserRole;
  isStaff: boolean;
  onUnreadCountChange?: (count: number) => void;  // Callback para notificar cambios en el contador
}

interface ConversationState {
  selectedCaseId: string | null;
  selectedUserCode: string | null;
  selectedCaseUserCode: string | null;  // 🔧 NUEVO: Código del usuario del caso
  messages: Message[];
  isLoading: boolean;
}

export const MessagingInterface: React.FC<MessagingInterfaceProps> = ({
  userCode,
  userRole,
  isStaff,
  onUnreadCountChange
}) => {
  const [inbox, setInbox] = useState<Message[]>([]);
  const [messagesByCase, setMessagesByCase] = useState<{ [caseId: string]: Message[] }>({});
  const [conversationState, setConversationState] = useState<ConversationState>({
    selectedCaseId: null,
    selectedUserCode: null,
    selectedCaseUserCode: null,
    messages: [],
    isLoading: false
  });
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cases' | 'conversation'>('conversation');  // 🔧 CAMBIO: Ahora por defecto es "conversation" (BUZÓN)
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll a últimos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationState.messages]);

  // Cargar bandeja de entrada al iniciar
  useEffect(() => {
    console.log('🎯 [MessagingInterface] Inicializando para usuario:', userCode);
    loadInbox();
    loadUnreadCount();
    
    // Recargar cada 2 segundos para mantener actualizado (tiempo real)
    const interval = setInterval(() => {
      console.log('🔄 [MessagingInterface] Recargando inbox...');
      loadInbox();
      loadUnreadCount();
    }, 2000);
    
    return () => clearInterval(interval);
  }, [userCode]);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      console.log('📬 [loadInbox] Cargando bandeja de entrada para:', userCode);
      
      // 🔧 Cargar inbox tradicional (tries BD, falls back to localStorage)
      const messages = await getInbox(userCode);
      console.log('📬 [loadInbox] Mensajes obtenidos del servidor/localStorage:', messages.length);
      setInbox(messages);
      
      // 🔧 Agrupar mensajes por conversación (usuario que envía/recibe)
      // Esto es para la vista "BUZÓN" (conversaciones)
      const conversations = new Map<string, Message[]>();
      messages.forEach((msg) => {
        const otherCode = msg.senderCode === userCode ? msg.recipientCode : msg.senderCode;
        if (!conversations.has(otherCode)) {
          conversations.set(otherCode, []);
        }
        conversations.get(otherCode)!.push(msg);
      });
      
      // 🔧 Convertir a objeto para messagesByCase (compatibilidad)
      const messagesByConversation: { [conversationId: string]: Message[] } = {};
      conversations.forEach((msgs, otherCode) => {
        const conversationId = `conv_${userCode}_${otherCode}`;
        messagesByConversation[conversationId] = msgs.sort((a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      console.log('✅ [loadInbox] Conversaciones encontradas:', Object.keys(messagesByConversation).length);
      Object.keys(messagesByConversation).forEach(convId => {
        console.log(`  - ${convId}: ${messagesByConversation[convId].length} mensajes`);
      });
      
      setMessagesByCase(messagesByConversation);
    } catch (error) {
      console.error('❌ [loadInbox] Error:', error);
      setMessagesByCase({});
    }
    setIsLoading(false);
  };

  const loadUnreadCount = async () => {
    const count = await getUnreadCount(userCode);
    setUnreadCount(count);
    // Notificar al componente padre
    if (onUnreadCountChange) {
      onUnreadCountChange(count);
    }
  };

  // NUEVA FUNCIÓN: Cargar conversación de un caso específico
  const loadCaseConversation = async (caseId: string, caseUserCode?: string) => {
    console.log('📖 [loadCaseConversation] Cargando conversación del caso:', caseId, 'userCode:', caseUserCode);
    setConversationState((prev) => ({ ...prev, isLoading: true }));
    
    // 🔧 FIX: Obtener mensajes directamente del caso, no del inbox filtrado
    const caseMessages = await getMessagesByCase(caseId);
    console.log(`✅ [loadCaseConversation] Caso ${caseId} tiene ${caseMessages.length} mensajes`);
    
    setConversationState({
      selectedCaseId: caseId,
      selectedUserCode: null,
      selectedCaseUserCode: caseUserCode || null,  // 🔧 Guardar código del usuario del caso
      messages: caseMessages.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
      isLoading: false
    });

    // Marcar como leídos los mensajes no leídos
    const unreadMessages = caseMessages.filter(
      (msg) => msg.status === 'UNREAD' && msg.recipientCode === userCode
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map((msg) => markAsRead(msg.id)));
      // Recargar inbox y contador después de marcar como leídos
      await loadInbox();
      await loadUnreadCount();
    }

    setViewMode('conversation');
  };

  const loadConversation = async (otherCode: string) => {
    setConversationState((prev) => ({ ...prev, isLoading: true }));
    const messages = await getConversation(userCode, otherCode);
    setConversationState({
      selectedCaseId: null,
      selectedUserCode: otherCode,
      messages,
      isLoading: false
    });

    // Marcar como leídos
    const unreadMessages = messages.filter(
      (msg) => msg.status === 'UNREAD' && msg.recipientCode === userCode
    );
    
    if (unreadMessages.length > 0) {
      await Promise.all(unreadMessages.map((msg) => markAsRead(msg.id)));
      // Recargar inbox y contador después de marcar como leídos
      await loadInbox();
      await loadUnreadCount();
    }

    setViewMode('conversation');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    // Determinar receptor y vinculación a caso
    const caseId = conversationState.selectedCaseId;
    const caseUserCode = conversationState.selectedCaseUserCode;
    const regularUserCode = conversationState.selectedUserCode;
    
    // 🔧 MEJORADO: Usar el código correcto del usuario
    const recipientCode = caseUserCode || regularUserCode || 'STAFF_USER';
    
    console.log('📨 [handleSendMessage]', { caseId, caseUserCode, regularUserCode, recipientCode });

    const result = await sendMessage(
      recipientCode,
      newMessage,
      userCode,
      'TEXT',
      caseId     // ← Vincular a caso si existe
    );

    if (result) {
      setNewMessage('');
      // Recargar conversación o caso
      if (caseId) {
        loadCaseConversation(caseId, caseUserCode || undefined);
      } else if (regularUserCode) {
        loadConversation(regularUserCode);
      }
    }
  };

  // 🔧 Ya no necesitamos crear conversations aquí porque loadInbox() ya lo hace

  return (
    <div className="messaging-container" style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={styles.title}>
          💬 Mensajes {unreadCount > 0 && <span>({unreadCount})</span>}
        </h2>

        {/* NUEVA VISTA: Pestaña de Casos */}
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('cases')}
            style={{
              ...styles.toggleButton,
              ...(viewMode === 'cases' && styles.toggleButtonActive)
            }}
          >
            📋 Casos
          </button>
          <button
            onClick={() => setViewMode('conversation')}
            style={{
              ...styles.toggleButton,
              ...(viewMode === 'conversation' && styles.toggleButtonActive)
            }}
          >
            👥 Conversaciones
          </button>
        </div>

        {isLoading ? (
          <p>Cargando...</p>
        ) : viewMode === 'cases' ? (
          // NUEVA SECCIÓN: Listado de casos con mensajes
          Object.keys(messagesByCase).length === 0 ? (
            <p style={styles.emptyMessage}>No hay mensajes de casos</p>
          ) : (
            <div style={styles.conversationList}>
              {Object.entries(messagesByCase).map(([caseId, caseMessages]: [string, Message[]]) => {
                const unreadInCase = caseMessages.filter(
                  (m) => m.status === 'UNREAD' && m.recipientCode === userCode
                ).length;
                const lastMsg = caseMessages[caseMessages.length - 1];
                const isSelected = conversationState.selectedCaseId === caseId;
                
                // 🔧 NUEVO: Obtener el código del otro usuario (no yo) del caso
                const caseUserCode = caseMessages.length > 0 
                  ? (caseMessages[0].senderCode === userCode 
                      ? caseMessages[0].recipientCode 
                      : caseMessages[0].senderCode)
                  : null;

                return (
                  <div
                    key={caseId}
                    onClick={() => loadCaseConversation(caseId, caseUserCode || undefined)}
                    style={{
                      ...styles.conversationItem,
                      ...(isSelected && styles.conversationItemSelected)
                    }}
                  >
                    <div style={styles.conversationHeader}>
                      <strong>📌 Caso #{caseId}</strong>
                      {unreadInCase > 0 && (
                        <span style={styles.badge}>{unreadInCase}</span>
                      )}
                    </div>
                    <p style={styles.lastMessagePreview}>
                      {lastMsg?.content?.substring(0, 50)}...
                    </p>
                    <small style={{ color: '#999', fontSize: '11px' }}>
                      {caseMessages.length} mensajes • Último: {new Date(lastMsg?.createdAt || '').toLocaleDateString('es-EC')}
                    </small>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // VISTA: Conversaciones por usuario (BUZÓN)
          Object.keys(messagesByCase).length === 0 ? (
            <p style={styles.emptyMessage}>📭 No hay conversaciones. Los mensajes que recibas aparecerán aquí.</p>
          ) : (
            <div style={styles.conversationList}>
              {Object.entries(messagesByCase).map(([conversationId, convMessages]: [string, Message[]]) => {
                // Extraer el código del otro usuario de conversationId (conv_USER1_USER2)
                const parts = conversationId.split('_');
                const user1 = parts[1];
                const user2 = parts[2];
                const otherCode = user1 === userCode ? user2 : user1;
                
                const unreadInConv = convMessages.filter(
                  (m) => m.status === 'UNREAD' && m.recipientCode === userCode
                ).length;
                const lastMessage = convMessages[convMessages.length - 1];
                const isSelected = conversationState.selectedUserCode === otherCode;

                return (
                  <div
                    key={conversationId}
                    onClick={() => loadConversation(otherCode)}
                    style={{
                      ...styles.conversationItem,
                      ...(isSelected && styles.conversationItemSelected)
                    }}
                  >
                    <div style={styles.conversationHeader}>
                      <strong>👤 {otherCode}</strong>
                      {unreadInConv > 0 && (
                        <span style={styles.badge}>{unreadInConv}</span>
                      )}
                    </div>
                    <p style={styles.lastMessagePreview}>
                      {lastMessage?.content?.substring(0, 60)}...
                    </p>
                    <small style={{ color: '#999', fontSize: '11px' }}>
                      {convMessages.length} mensajes • {new Date(lastMessage?.createdAt || '').toLocaleDateString('es-EC')}
                    </small>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <div style={styles.chatArea}>
        {conversationState.selectedCaseId || conversationState.selectedUserCode ? (
          <>
            <div style={styles.chatHeader}>
              <h3>
                {conversationState.selectedCaseId
                  ? `Caso #${conversationState.selectedCaseId} - conversationId=${conversationState.selectedCaseId}`
                  : `Conversación con ${conversationState.selectedUserCode}`}
              </h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={styles.roleTag}>{userRole}</span>
                <button
                  onClick={() => {
                    setConversationState({
                      selectedCaseId: null,
                      selectedUserCode: null,
                      selectedCaseUserCode: null,
                      messages: [],
                      isLoading: false
                    });
                  }}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>
            </div>

            {conversationState.isLoading ? (
              <p>Cargando conversación...</p>
            ) : (
              <div style={styles.messagesContainer}>
                {conversationState.messages.length === 0 ? (
                  <p style={styles.noMessages}>
                    No hay mensajes aún. ¡Inicia la conversación!
                  </p>
                ) : (
                  conversationState.messages.map((msg) => {
                    // Determinar si el remitente es STAFF/ADMIN (DECE) o un usuario
                    const isDECESender = msg.senderRole === UserRole.STAFF || msg.senderRole === UserRole.ADMIN;
                    const senderLabel = isDECESender ? 'DECE' : 'USUARIO';
                    
                    return (
                      <div
                        key={msg.id}
                        style={{
                          ...styles.message,
                          ...(msg.senderCode === userCode
                            ? styles.messageSent
                            : styles.messageReceived)
                        }}
                      >
                        <div style={styles.messageContent}>
                          <div style={styles.messageSender}>
                            <strong>{senderLabel}</strong>
                          </div>
                          <p style={styles.messageText}>{msg.content}</p>
                          <small style={styles.messageTime}>
                            {new Date(msg.createdAt).toLocaleString('es-EC')}
                          </small>
                        </div>
                        {msg.status === 'UNREAD' && (
                          <span style={styles.unreadIndicator}>●</span>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={
                  conversationState.selectedCaseId
                    ? `Responder en Caso #${conversationState.selectedCaseId}...`
                    : "Escribe un mensaje..."
                }
                style={styles.input}
              />
              <button type="submit" style={styles.sendButton}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={styles.noConversation}>
            <p>Selecciona un caso o conversación para continuar</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '600px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif'
  } as React.CSSProperties,
  sidebar: {
    width: '280px',
    borderRight: '1px solid #ddd',
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: '#f9f9f9'
  } as React.CSSProperties,
  title: {
    marginTop: 0,
    marginBottom: '12px',
    fontSize: '16px',
    fontWeight: 'bold'
  } as React.CSSProperties,
  viewToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #ddd',
    paddingBottom: '12px'
  } as React.CSSProperties,
  toggleButton: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ccc',
    backgroundColor: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    color: '#666'
  } as React.CSSProperties,
  toggleButtonActive: {
    backgroundColor: '#2196f3',
    color: 'white',
    borderColor: '#2196f3'
  } as React.CSSProperties,
  conversationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  } as React.CSSProperties,
  conversationItem: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s'
  } as React.CSSProperties,
  conversationItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    fontWeight: 'bold'
  } as React.CSSProperties,
  conversationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  } as React.CSSProperties,
  badge: {
    backgroundColor: '#f44336',
    color: 'white',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: 'bold'
  } as React.CSSProperties,
  lastMessagePreview: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '4px'
  } as React.CSSProperties,
  emptyMessage: {
    color: '#999',
    textAlign: 'center',
    padding: '20px'
  } as React.CSSProperties,
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white'
  } as React.CSSProperties,
  chatHeader: {
    padding: '16px',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties,
  roleTag: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  } as React.CSSProperties,
  closeButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  } as React.CSSProperties,
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: '#fafafa'
  } as React.CSSProperties,
  noMessages: {
    textAlign: 'center',
    color: '#999',
    marginTop: '20px'
  } as React.CSSProperties,
  message: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    maxWidth: '70%'
  } as React.CSSProperties,
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196f3',
    borderRadius: '12px 12px 0 12px'
  } as React.CSSProperties,
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px 12px 12px 0'
  } as React.CSSProperties,
  messageContent: {
    padding: '12px',
    flex: 1
  } as React.CSSProperties,
  messageSender: {
    marginBottom: '4px',
    fontSize: '11px',
    opacity: 0.9,
    color: '#fff'
  } as React.CSSProperties,
  messageText: {
    margin: 0,
    marginBottom: '4px',
    wordBreak: 'break-word',
    color: '#fff'
  } as React.CSSProperties,
  messageTime: {
    fontSize: '11px',
    opacity: 0.8,
    color: '#fff'
  } as React.CSSProperties,
  unreadIndicator: {
    color: '#f44336',
    fontSize: '12px'
  } as React.CSSProperties,
  noConversation: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#999'
  } as React.CSSProperties,
  inputForm: {
    display: 'flex',
    gap: '8px',
    padding: '16px',
    borderTop: '1px solid #ddd'
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  } as React.CSSProperties,
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  } as React.CSSProperties
};
