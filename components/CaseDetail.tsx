import React, { useState, useEffect } from 'react';
import { ConflictCase, CaseStatus, InterventionRecord, UserProfile, Message } from '../types';
import { 
  saveCase, 
  getUserProfileByCode, 
  addNotificationToUser, 
  getMessagesByCase,
  sendMessageWithCase,
  getChats,
  getChatMessages
} from '../services/storageService';
import jsPDF from 'jspdf';

interface CaseDetailProps {
  caseData: ConflictCase;
  userCode: string;  // NUEVO: Código del Staff actual
  onBack: () => void;
  onUpdate: () => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ caseData, userCode, onBack, onUpdate }) => {
  const [interventionNote, setInterventionNote] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>(caseData.status);
  const [linkedProfile, setLinkedProfile] = useState<UserProfile | undefined>(undefined);
  
  // NUEVOS ESTADOS: Gestión de mensajes integrados con el caso
  const [caseMessages, setCaseMessages] = useState<Message[]>([]);
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([]);
  const [directMessage, setDirectMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

  // NUEVOS ESTADOS: Gestión de evidencias (Azure Blob Storage)
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(false);

  // EFECTO ACTUALIZADO: Carga asíncrona del perfil desde Azure SQL
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getUserProfileByCode(caseData.encryptedUserCode);
        setLinkedProfile(profile);
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };
    if (caseData.encryptedUserCode) fetchProfile();
  }, [caseData.encryptedUserCode, caseData]);

  // EFECTO NUEVO: Cargar mensajes del caso al inicializar
  useEffect(() => {
    const loadCaseMessages = async () => {
      setLoadingMessages(true);
      try {
        const messages = await getMessagesByCase(caseData.id);
        setCaseMessages(messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ));
      } catch (error) {
        console.error('Error al cargar mensajes del caso:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    if (caseData.id) {
      loadCaseMessages();
      // Recargar cada 10 segundos para mantener actualizado
      const interval = setInterval(loadCaseMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [caseData.id]);

  // NUEVO: Cargar conversación IA asociada al caso desde ChatConversation
  useEffect(() => {
    const loadAIConversation = async () => {
      try {
        // Buscar los chats del usuario y filtrar por caseId
        const chats = await getChats(caseData.encryptedUserCode);
        const related = Array.isArray(chats)
          ? chats.find((c: any) => c.caseId === caseData.id)
          : undefined;

        if (related?.id) {
          const msgs = await getChatMessages(related.id);
          setAiChatMessages(Array.isArray(msgs) ? msgs : []);
        } else {
          // Fallback: si no hay chat específico, usar los mensajes embebidos si existen
          setAiChatMessages(Array.isArray(caseData.messages) ? caseData.messages : []);
        }
      } catch (e) {
        console.error('Error cargando conversación IA del caso:', e);
        setAiChatMessages(Array.isArray(caseData.messages) ? caseData.messages : []);
      }
    };

    if (caseData?.encryptedUserCode && caseData?.id) {
      loadAIConversation();
    }
  }, [caseData.encryptedUserCode, caseData.id]);

  // NUEVO: Cargar evidencias del caso desde Azure Blob Storage
  useEffect(() => {
    const loadEvidences = async () => {
      setLoadingEvidences(true);
      try {
        const response = await fetch(`/api/evidence/case/${caseData.id}`, {
          headers: { 'x-user-code': userCode }
        });
        if (response.ok) {
          const data = await response.json();
          setEvidences(data);
        }
      } catch (error) {
        console.error('Error cargando evidencias:', error);
      } finally {
        setLoadingEvidences(false);
      }
    };

    if (caseData.id) {
      loadEvidences();
    }
  }, [caseData.id, userCode]);

  useEffect(() => {
    setNewStatus(caseData.status);
  }, [caseData.status]);

  // FUNCIÓN ACTUALIZADA: Manejo asíncrono de guardado
  const handleAddIntervention = async () => {
    if (!interventionNote) return;

    const record: InterventionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      actionTaken: interventionNote,
      responsible: 'Gestor Institucional' 
    };

    const updatedCase = {
      ...caseData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      interventions: [...(caseData.interventions || []), record]
    };

    await saveCase(updatedCase);
    
    await addNotificationToUser(
        caseData.encryptedUserCode,
        `Actualización de Caso #${caseData.id}`,
        `Se ha registrado una nueva acción: "${interventionNote}". Estado: ${newStatus}.`,
        'INFO',
        caseData.id
    );

    setInterventionNote('');
    onUpdate();
  };

  // NUEVA FUNCIÓN: Enviar mensaje directo vinculado al caso
  const handleSendDirectMessage = async () => {
    if (!directMessage.trim()) return;

    try {
      const result = await sendMessageWithCase(
        caseData.id,                    // conversationId = caseId
        caseData.encryptedUserCode,     // Destinatario
        directMessage,                  // Contenido
        userCode,                        // Staff enviando (remitente actual)
        'TEXT'
      );

      if (result) {
        // Agregar el nuevo mensaje a la lista local
        const newMsg: Message = {
          id: result.id,
          senderId: 'staff-id',
          senderCode: userCode,
          senderRole: 'STAFF' as any,
          recipientId: 'user-id',
          recipientCode: caseData.encryptedUserCode,
          recipientRole: 'STUDENT' as any,
          content: directMessage,
          status: 'UNREAD',
          messageType: 'TEXT',
          conversationId: caseData.id,
          caseId: caseData.id,
          createdAt: new Date().toISOString()
        };
        
        setCaseMessages([...caseMessages, newMsg]);
        setDirectMessage('');
        
        // Notificar también al usuario
        await addNotificationToUser(
          caseData.encryptedUserCode,
          `Nuevo mensaje en Caso #${caseData.id}`,
          directMessage,
          'REQUEST',
          caseData.id
        );
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleGenerateReport = async () => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    const footerHeight = 15;

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - footerHeight) {
            doc.addPage();
            yPos = 20;
        }
    };

    // HELPER: Agregar texto multilinea
    const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth - 10);
        checkPageBreak(lines.length * (fontSize / 2.5));
        doc.text(lines, margin + 5, yPos);
        yPos += lines.length * (fontSize / 2.5) + 3;
    };

    // HEADER
    doc.setFontSize(18);
    doc.setTextColor(49, 46, 129);
    doc.text("REPORTE TÉCNICO INTEGRAL DE GESTIÓN - CUÉNTAME", margin, yPos);
    yPos += 12;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`ID ÚNICO DE CASO: ${caseData.id}`, margin, yPos);
    yPos += 4;
    doc.text(`FECHA DE CIERRE: ${new Date().toLocaleDateString('es-EC')}`, margin, yPos);
    yPos += 4;
    doc.text(`ESTADO: ${caseData.status}`, margin, yPos);
    yPos += 8;

    // SECCIÓN 1: IDENTIFICACIÓN
    doc.setFontSize(13);
    doc.setTextColor(49, 46, 129);
    doc.text("1. IDENTIFICACIÓN DEL USUARIO (IDENTIDAD RESERVADA)", margin, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`Código Encriptado: ${caseData.encryptedUserCode}`, margin, yPos);
    yPos += 5;
    doc.text(`Rol del Reportante: ${caseData.reporterRole}`, margin, yPos);
    yPos += 5;
    doc.text(`Fecha de Ingreso: ${new Date(caseData.createdAt).toLocaleDateString('es-EC')}`, margin, yPos);
    yPos += 5;
    doc.text(`Última Actualización: ${new Date(caseData.updatedAt).toLocaleDateString('es-EC')}`, margin, yPos);
    yPos += 10;

    // SECCIÓN 2: DETALLE DEL CONFLICTO
    doc.setFontSize(13);
    doc.setTextColor(49, 46, 129);
    doc.text("2. DETALLE DEL CONFLICTO", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Tipología (MINEDUC): ${caseData.typology}`, margin, yPos);
    yPos += 5;
    doc.text(`Nivel de Riesgo: ${caseData.riskLevel}`, margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text("Resumen Ejecutivo:", margin, yPos);
    yPos += 4;
    addWrappedText(caseData.summary, 9);
    yPos += 5;

    // SECCIÓN 3: RECOMENDACIONES
    if (caseData.recommendations && caseData.recommendations.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(49, 46, 129);
        doc.text("3. RECOMENDACIONES (IA)", margin, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setTextColor(0);
        caseData.recommendations.forEach((rec, idx) => {
            addWrappedText(`${idx + 1}. ${rec}`, 9);
        });
        yPos += 5;
    }

    // SECCIÓN 4: PROTOCOLO Y DERIVACIÓN
    doc.setFontSize(13);
    doc.setTextColor(49, 46, 129);
    doc.text("4. PROTOCOLO Y DERIVACIÓN", margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Protocolo Activado: ${caseData.assignedProtocol}`, margin, yPos);
    yPos += 5;
    doc.text(`Responsable Asignado: ${caseData.assignedTo}`, margin, yPos);
    yPos += 10;

    // SECCIÓN 5: CONVERSACIÓN BOT-USUARIO (IA)
    const normalizedAIMessages = (Array.isArray(aiChatMessages) ? aiChatMessages : [])
      .map((m: any) => ({
        sender: (m?.role ? (m.role === 'user' ? 'user' : 'assistant') : (m?.sender || 'user')),
        text: (m?.content ?? m?.text ?? ''),
        timestamp: (m?.timestamp ?? m?.createdAt ?? new Date().toISOString())
      }))
      .filter(m => m.text && typeof m.text === 'string');

    if (normalizedAIMessages.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(49, 46, 129);
        doc.text("5. Conversación con Asistente IA", margin, yPos);
        yPos += 7;

        doc.setFontSize(8);
        normalizedAIMessages.forEach((msg) => {
            checkPageBreak(10);
            const senderLabel = msg.sender === 'user' ? '[Usuario]' : '[Asistente IA]';
            const msgColor = msg.sender === 'user' ? [30, 58, 138] : [49, 46, 129];
            doc.setTextColor(msgColor[0], msgColor[1], msgColor[2]);
            doc.text(senderLabel, margin + 2, yPos);
            yPos += 3;
            
            const msgLines = doc.splitTextToSize(msg.text, maxWidth - 15);
            checkPageBreak(msgLines.length * 3.5);
            doc.setTextColor(60);
            doc.text(msgLines, margin + 5, yPos);
            yPos += msgLines.length * 3.5 + 2;
            
            doc.setTextColor(150);
            doc.setFontSize(7);
            doc.text(`${new Date(msg.timestamp).toLocaleString('es-EC')}`, margin + 5, yPos);
            doc.setFontSize(8);
            yPos += 3;
        });
        yPos += 5;
    }

    // SECCIÓN 6: MENSAJES ENTRE STAFF Y USUARIO
    if (caseMessages && caseMessages.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(49, 46, 129);
      doc.text("6. Conversación entre Personal Institucional y Usuario", margin, yPos);
        yPos += 7;

        doc.setFontSize(8);
        caseMessages.forEach((msg) => {
            checkPageBreak(10);
        const senderLabel = msg.senderCode === userCode ? '[Personal]' : '[Usuario]';
            const msgColor = msg.senderCode === userCode ? [34, 197, 94] : [30, 58, 138];
            doc.setTextColor(msgColor[0], msgColor[1], msgColor[2]);
            doc.text(senderLabel, margin + 2, yPos);
            yPos += 3;
            
            const msgLines = doc.splitTextToSize(msg.content, maxWidth - 15);
            checkPageBreak(msgLines.length * 3.5);
            doc.setTextColor(60);
            doc.text(msgLines, margin + 5, yPos);
            yPos += msgLines.length * 3.5 + 2;
            
            doc.setTextColor(150);
            doc.setFontSize(7);
            doc.text(`[${msg.status}] ${new Date(msg.createdAt).toLocaleString('es-EC')}`, margin + 5, yPos);
            doc.setFontSize(8);
            yPos += 3;
        });
        yPos += 5;
    }

    // SECCIÓN 7: HISTORIAL DE ACCIONES
    if (caseData.interventions && caseData.interventions.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(49, 46, 129);
        doc.text("7. HISTORIAL DE ACCIONES Y GESTIÓN", margin, yPos);
        yPos += 7;

        doc.setFontSize(8);
        caseData.interventions.forEach((intervention, idx) => {
            checkPageBreak(8);
            doc.setTextColor(0);
            doc.text(`Acción ${idx + 1}:`, margin + 2, yPos);
            yPos += 3;
            
            doc.setTextColor(60);
            doc.text(`Fecha: ${new Date(intervention.date).toLocaleDateString('es-EC')}`, margin + 5, yPos);
            yPos += 3;
            
            doc.text(`Responsable: ${intervention.responsible}`, margin + 5, yPos);
            yPos += 3;
            
            const actionLines = doc.splitTextToSize(`Acción: ${intervention.actionTaken}`, maxWidth - 15);
            checkPageBreak(actionLines.length * 3.5);
            doc.text(actionLines, margin + 5, yPos);
            yPos += actionLines.length * 3.5;

            if (intervention.outcome) {
                const outcomeLines = doc.splitTextToSize(`Resultado: ${intervention.outcome}`, maxWidth - 15);
                checkPageBreak(outcomeLines.length * 3.5);
                doc.text(outcomeLines, margin + 5, yPos);
                yPos += outcomeLines.length * 3.5;
            }
            
            yPos += 3;
        });
        yPos += 5;
    }

    // SECCIÓN 8: EVIDENCIA (si existe)
    if (caseData.evidence && caseData.evidence.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(49, 46, 129);
        doc.text("8. EVIDENCIA ADJUNTA", margin, yPos);
        yPos += 7;

        doc.setFontSize(8);
        caseData.evidence.forEach((evidence) => {
            checkPageBreak(5);
            doc.setTextColor(0);
            doc.text(`- ${evidence.name} (${evidence.mimeType}) - ${new Date(evidence.date).toLocaleDateString('es-EC')}`, margin + 5, yPos);
            yPos += 4;
        });
        yPos += 5;
    }

    // FOOTER EN CADA PÁGINA
    const totalPages = doc.getNumberOfPages();
    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("Este documento contiene información sensible protegida por el Código de la Niñez y la LOEI.", margin, pageHeight - 8);
        doc.text("La identidad del estudiante se mantiene bajo encriptación para su protección integral.", margin, pageHeight - 4);
        doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin - 15, pageHeight - 4);
    }

    doc.save(`Reporte_Privado_${caseData.id}.pdf`);
    
    if (caseData.status !== CaseStatus.CLOSED) {
        const closedCase = { ...caseData, status: CaseStatus.CLOSED, updatedAt: new Date().toISOString() };
        await saveCase(closedCase);
        await addNotificationToUser(
            caseData.encryptedUserCode,
            `Caso Cerrado #${caseData.id}`,
            `El protocolo ha finalizado con éxito. Gracias por confiar en nosotros.`
        );
        onUpdate();
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 p-6 sm:p-10 space-y-10 transition-colors duration-200">
      
      <div className="flex justify-between items-start border-b-2 border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <button onClick={onBack} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-800 dark:hover:text-indigo-400 mb-2 flex items-center gap-1 transition">
            ← Volver al Panel
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Gestión de Caso: <span className="text-indigo-700 dark:text-indigo-400">{caseData.id}</span></h1>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tight">Usuario Código: {caseData.encryptedUserCode}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-sm ${
                caseData.riskLevel === 'CRÍTICO' ? 'bg-red-700' : 
                caseData.riskLevel === 'ALTO' ? 'bg-orange-600' :
                caseData.riskLevel === 'MEDIO' ? 'bg-amber-500' : 'bg-emerald-600'
            }`}>
                Riesgo: {caseData.riskLevel}
            </span>
             <span className="text-xs font-bold text-gray-400 italic">Fecha Apertura: {new Date(caseData.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded"></span>
          1. Resumen del Conflicto
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-xl text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium leading-relaxed shadow-inner">
            {caseData.summary}
        </div>
      </section>

      {caseData.recommendations && caseData.recommendations.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-600 rounded"></span>
            2. Recomendaciones (IA)
          </h3>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800">
            <ul className="space-y-3">
              {caseData.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-sm font-bold text-purple-900 dark:text-purple-200">
                  <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded"></span>
          3. Protocolo Activado
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-blue-950/40 p-4 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-blue-400">Ruta de Intervención</span>
                <p className="font-extrabold text-lg mt-1">{caseData.assignedProtocol}</p>
            </div>
            <div className="bg-white dark:bg-blue-950/40 p-4 rounded-lg">
                <span className="text-[10px] uppercase font-bold text-blue-400">Autoridad a Cargo</span>
                <p className="font-extrabold text-lg mt-1">{caseData.assignedTo}</p>
            </div>
        </div>
      </section>

      {/* Módulo de Comunicación con protección contra error .filter */}
      {/* NUEVA SECCIÓN: Mensajes Integrados del Caso */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-600 rounded"></span>
          7. Hilo de Conversación (conversationId = {caseData.id})
        </h3>
        
        <div className="space-y-4">
          {/* Área de mensajes */}
          <div className="bg-gradient-to-b from-emerald-50 dark:from-emerald-950/20 to-white dark:to-gray-800 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-900 overflow-y-auto max-h-96 space-y-3">
            {loadingMessages && (
              <div className="text-center py-6 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                Cargando mensajes...
              </div>
            )}
            
            {caseMessages.length === 0 && !loadingMessages && (
              <div className="text-center py-10 text-gray-400 italic text-sm font-bold">
                Sin mensajes aún. Inicia una conversación directa con el usuario.
              </div>
            )}
            
            {caseMessages.map((msg, idx) => {
              // Determinar si el mensaje fue enviado por el staff actual
              const isMySender = msg.senderCode === userCode;
              // Determinar si el remitente es STAFF/ADMIN (DECE) o un usuario
              const isDECESender = msg.senderRole === 'STAFF' || msg.senderRole === 'ADMIN';
              const senderLabel = isDECESender ? 'DECE' : 'USUARIO';
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMySender ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-md px-4 py-3 rounded-2xl border ${
                    isMySender
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'
                      : 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700'
                  }`}>
                    <p className={`text-xs font-bold mb-1 ${
                      isMySender
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      {senderLabel} • {new Date(msg.createdAt).toLocaleTimeString('es-EC')}
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{msg.content}</p>
                    {msg.messageType !== 'TEXT' && (
                      <span className={`text-[9px] font-bold mt-2 block ${
                        isMySender
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        📎 {msg.messageType}
                      </span>
                    )}
                    {msg.status && (
                      <span className={`text-[8px] font-bold mt-2 px-2 py-1 rounded-full inline-block ${
                        msg.status === 'UNREAD'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400'
                      }`}>
                        {msg.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Área de entrada */}
          <div className="space-y-3">
            <textarea
              className="w-full border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              placeholder="Escribir mensaje directo al usuario (se vincula automáticamente a este caso)..."
              value={directMessage}
              onChange={(e) => setDirectMessage(e.target.value)}
            />
            <button 
              onClick={handleSendDirectMessage}
              disabled={!directMessage.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-extrabold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
              ✉️ Enviar Mensaje (conversationId={caseData.id})
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Evidencias (Azure Blob Storage) */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-purple-600 rounded"></span>
          8. Evidencias del Caso
        </h3>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          {loadingEvidences ? (
            <div className="text-center py-8 text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="mt-2 font-semibold">Cargando evidencias...</p>
            </div>
          ) : evidences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📂</span>
              <p className="font-semibold">No hay evidencias cargadas por el usuario</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {evidences.map((evidence) => (
                <div 
                  key={evidence.id}
                  className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  {/* Preview según tipo */}
                  {evidence.contentType.startsWith('image/') ? (
                    <img 
                      src={evidence.url} 
                      alt={evidence.fileName}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-5xl">
                        {evidence.contentType === 'application/pdf' ? '📄' : '📝'}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate" title={evidence.fileName}>
                      {evidence.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(evidence.fileSize / 1024).toFixed(0)} KB
                    </p>
                    <p className="text-xs text-gray-500">
                      Subido: {new Date(evidence.createdAt).toLocaleDateString('es-EC')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Por: {evidence.uploadedByRole}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    <a 
                      href={evidence.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-lg text-center transition-all"
                    >
                      👁️ Ver/Descargar
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Historial de Auditoría */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gray-600 rounded"></span>
          9. Historial de Acciones
        </h3>
        
        <div className="space-y-6">
          {/* Mostrar intervenciones existentes */}
          {caseData.interventions && caseData.interventions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4 max-h-96 overflow-y-auto">
              <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">
                📋 Registro de Intervenciones ({caseData.interventions.length})
              </h4>
              {caseData.interventions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((intervention, idx) => (
                  <div 
                    key={intervention.id} 
                    className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border-l-4 border-gray-400 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <span className="text-[11px] font-bold uppercase text-gray-600 dark:text-gray-400 block mb-1">
                          Acción #{idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                          📅 {new Date(intervention.date).toLocaleDateString('es-EC')} {new Date(intervention.date).toLocaleTimeString('es-EC')}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 rounded-full">
                        {intervention.responsible}
                      </span>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-2">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                        {intervention.actionTaken}
                      </p>
                    </div>
                    
                    {intervention.outcome && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border-l-2 border-emerald-500">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block mb-1">
                          Resultado
                        </span>
                        <p className="text-xs text-emerald-900 dark:text-emerald-100 font-semibold">
                          {intervention.outcome}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Formulario para agregar nueva intervención */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-300 dark:border-gray-700 space-y-4">
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              ➕ Registrar Nueva Acción
            </h4>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase block mb-2">
                      Nuevo Estado
                    </label>
                    <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 font-bold text-gray-900 dark:text-white"
                    >
                        {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase block mb-2">
                      Describir Acción Tomada
                    </label>
                    <textarea
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 text-sm"
                        rows={3}
                        placeholder="Detallar la medida, intervención o seguimiento realizado..."
                        value={interventionNote}
                        onChange={(e) => setInterventionNote(e.target.value)}
                    />
                </div>
            </div>
            <button 
                onClick={handleAddIntervention}
                disabled={!interventionNote}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-extrabold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
            >
                ✅ Actualizar Bitácora del Caso
            </button>
          </div>
        </div>
      </section>

      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-gray-500 font-bold max-w-sm">Información protegida por el Código de la Niñez y la LOEI.</p>
        <button
            onClick={handleGenerateReport}
            className="flex items-center gap-3 bg-indigo-900 dark:bg-black text-white px-10 py-5 rounded-2xl hover:bg-black transition-all shadow-2xl font-extrabold border border-indigo-700"
        >
            CERRAR CASO & GENERAR PDF ANÓNIMO
        </button>
      </div>
    </div>
  );
};

export default CaseDetail;