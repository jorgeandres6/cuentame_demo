import React, { useState, useEffect } from 'react';
import { ConflictCase, CaseStatus, InterventionRecord, UserProfile, Message } from '../types';
import { 
  saveCase, 
  getUserProfileByCode, 
  addNotificationToUser, 
  getMessagesByCase,
  sendMessageWithCase 
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
  const [messageToUser, setMessageToUser] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>(caseData.status);
  const [linkedProfile, setLinkedProfile] = useState<UserProfile | undefined>(undefined);
  const [showEvidence, setShowEvidence] = useState(false);
  
  // NUEVOS ESTADOS: Gestión de mensajes integrados con el caso
  const [caseMessages, setCaseMessages] = useState<Message[]>([]);
  const [directMessage, setDirectMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);

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

  const handleSendMessageToUser = async () => {
      if (!messageToUser) return;
      
      // CORRECCIÓN: Usar sendMessageWithCase para guardar en BD
      const result = await sendMessageWithCase(
          caseData.id,                          // caseId
          caseData.encryptedUserCode,          // recipientCode (usuario del caso)
          messageToUser,                        // content
          userCode,                             // userCode (remitente, header x-user-code)
          'TEXT',                               // messageType
          undefined                             // attachmentUrl (opcional)
      );

      if (result) {
          console.log('✅ Mensaje guardado en BD:', result.id);
          setMessageToUser('');
          
          // Recargar los mensajes del caso
          const messages = await getMessagesByCase(caseData.id);
          setCaseMessages(messages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ));
          
          const updatedProfile = await getUserProfileByCode(caseData.encryptedUserCode);
          setLinkedProfile(updatedProfile);
          onUpdate();
      } else {
          console.error('❌ Error al enviar mensaje');
      }
  };

  const handleGenerateReport = async () => {
    const doc = new jsPDF();
    let yPos = 20;

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > 280) {
            doc.addPage();
            yPos = 20;
        }
    };
    
    doc.setFontSize(18);
    doc.setTextColor(49, 46, 129);
    doc.text("REPORTE TÉCNICO DE GESTIÓN - CUÉNTAME", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID ÚNICO DE CASO: ${caseData.id}`, 20, yPos);
    yPos += 5;
    doc.text(`FECHA DE CIERRE: ${new Date().toLocaleDateString('es-EC')}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("1. Identificación del Usuario (Identidad Reservada)", 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Código Encriptado de Usuario: ${caseData.encryptedUserCode}`, 20, yPos);
    yPos += 5;
    doc.text(`Rol del Reportante: ${caseData.reporterRole}`, 20, yPos);
    yPos += 12;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("2. Detalle del Conflicto", 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Tipología (MINEDUC): ${caseData.typology}`, 20, yPos);
    yPos += 5;
    doc.text(`Nivel de Riesgo Asignado: ${caseData.riskLevel}`, 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.text("Resumen Ejecutivo:", 20, yPos);
    yPos += 6;
    doc.setFontSize(11);
    const splitSummary = doc.splitTextToSize(caseData.summary, 170);
    checkPageBreak(splitSummary.length * 5);
    doc.text(splitSummary, 20, yPos);
    yPos += (splitSummary.length * 5) + 15;

    doc.setFontSize(14);
    doc.text("3. Protocolo y Derivación", 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Protocolo Activado: ${caseData.assignedProtocol}`, 20, yPos);
    yPos += 5;
    doc.text(`Responsable Asignado: ${caseData.assignedTo}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Este documento contiene información sensible protegida por el Código de la Niñez y la LOEI.", 20, 285);
    doc.text("La identidad del estudiante se mantiene bajo encriptación para su protección integral.", 20, 290);
    
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

  // Lógica de filtrado con protección contra undefined/null
  const requestNotifications = Array.isArray(linkedProfile?.notifications) 
    ? linkedProfile!.notifications.filter(n => n.relatedCaseId === caseData.id && n.type === 'REQUEST')
    : [];

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
          6. Hilo de Conversación (conversationId = {caseData.id})
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
            
            {caseMessages.map((msg, idx) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-xl border ${
                  msg.senderCode === 'STAFF_USER' 
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 ml-8'
                    : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 mr-8'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase ${
                    msg.senderCode === 'STAFF_USER' 
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {msg.senderCode === 'STAFF_USER' ? '👨‍💼 Staff' : '👤 Usuario'} - {new Date(msg.createdAt).toLocaleTimeString('es-EC')}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${
                    msg.status === 'UNREAD'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}>
                    {msg.status}
                  </span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                  {msg.content}
                </p>
                {msg.messageType !== 'TEXT' && (
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mt-2 block">
                    📎 {msg.messageType}
                  </span>
                )}
              </div>
            ))}
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

      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-cyan-500 rounded"></span>
          7. Notificaciones Directas (Método Anterior)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-300 dark:border-gray-700">
                <textarea
                    className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl p-4 text-sm"
                    rows={4}
                    placeholder="Solicitar información adicional..."
                    value={messageToUser}
                    onChange={(e) => setMessageToUser(e.target.value)}
                />
                <button 
                    onClick={handleSendMessageToUser}
                    disabled={!messageToUser}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl font-extrabold disabled:opacity-50"
                >
                    Notificar al Usuario
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-64">
                <span className="text-[10px] font-bold text-gray-400 uppercase mb-4 block">Registro de Intercambios</span>
                <div className="space-y-4">
                    {requestNotifications.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic text-sm font-bold">Sin mensajes registrados.</div>
                    ) : (
                        requestNotifications.map(msg => (
                            <div key={msg.id} className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-extrabold text-cyan-700 uppercase">Enviado: {new Date(msg.date).toLocaleDateString()}</span>
                                    {msg.reply ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">CON RESPUESTA</span> : <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-bold">ESPERANDO</span>}
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-3">"{msg.message}"</p>
                                {msg.reply && (
                                    <div className="mt-3 pl-3 border-l-2 border-green-500 bg-white dark:bg-gray-900 p-3 rounded-r-lg">
                                        <p className="text-xs text-gray-900 dark:text-white font-extrabold italic">"{msg.reply}"</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Historial de Auditoría */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gray-600 rounded"></span>
          8. Historial de Acciones
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-300 dark:border-gray-700 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                    <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 font-bold"
                    >
                        {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <textarea
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl p-4 text-sm"
                        rows={3}
                        placeholder="Describir medida adoptada..."
                        value={interventionNote}
                        onChange={(e) => setInterventionNote(e.target.value)}
                    />
                </div>
            </div>
            <button 
                onClick={handleAddIntervention}
                disabled={!interventionNote}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-extrabold disabled:opacity-50"
            >
                Actualizar Bitácora del Caso
            </button>
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