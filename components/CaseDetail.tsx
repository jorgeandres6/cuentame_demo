
import React, { useState, useEffect } from 'react';
import { ConflictCase, CaseStatus, InterventionRecord, UserProfile } from '../types';
import { saveCase, getUserProfileByCode, addNotificationToUser } from '../services/storageService';
import jsPDF from 'jspdf';

interface CaseDetailProps {
  caseData: ConflictCase;
  onBack: () => void;
  onUpdate: () => void;
}

const CaseDetail: React.FC<CaseDetailProps> = ({ caseData, onBack, onUpdate }) => {
  const [interventionNote, setInterventionNote] = useState('');
  const [messageToUser, setMessageToUser] = useState('');
  const [newStatus, setNewStatus] = useState<CaseStatus>(caseData.status);
  const [linkedProfile, setLinkedProfile] = useState<UserProfile | undefined>(undefined);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    // Solo para visualizar psicográficos anónimos en la UI, no para el reporte final desanonimizado
    const profile = getUserProfileByCode(caseData.encryptedUserCode);
    setLinkedProfile(profile);
  }, [caseData.encryptedUserCode, caseData]);

  useEffect(() => {
    setNewStatus(caseData.status);
  }, [caseData.status]);

  const handleAddIntervention = () => {
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
      interventions: [...caseData.interventions, record]
    };

    saveCase(updatedCase);
    
    addNotificationToUser(
        caseData.encryptedUserCode,
        `Actualización de Caso #${caseData.id}`,
        `Se ha registrado una nueva acción: "${interventionNote}". Estado: ${newStatus}.`,
        'INFO',
        caseData.id
    );

    setInterventionNote('');
    onUpdate();
  };

  const handleSendMessageToUser = () => {
      if (!messageToUser) return;
      
      addNotificationToUser(
          caseData.encryptedUserCode,
          `Mensaje del Encargado - Caso #${caseData.id}`,
          messageToUser,
          'REQUEST',
          caseData.id
      );

      setMessageToUser('');
      onUpdate();
      
      const updatedProfile = getUserProfileByCode(caseData.encryptedUserCode);
      setLinkedProfile(updatedProfile);
  };

  const handleGenerateReport = () => {
    // ELIMINADA LA DESANONIMIZACIÓN - EL SISTEMA SOLO USA EL CÓDIGO
    const doc = new jsPDF();
    let yPos = 20;

    const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > 280) {
            doc.addPage();
            yPos = 20;
        }
    };
    
    // Header Institucional
    doc.setFontSize(18);
    doc.setTextColor(49, 46, 129); // Indigo 900
    doc.text("REPORTE TÉCNICO DE GESTIÓN - CUÉNTAME", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ID ÚNICO DE CASO: ${caseData.id}`, 20, yPos);
    yPos += 5;
    doc.text(`FECHA DE CIERRE: ${new Date().toLocaleDateString('es-EC')}`, 20, yPos);
    yPos += 15;

    // 1. Identificación Anónima
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

    // 2. Detalle del Conflicto
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

    // 3. Protocolo
    doc.setFontSize(14);
    doc.text("3. Protocolo y Derivación", 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Protocolo Activado: ${caseData.assignedProtocol}`, 20, yPos);
    yPos += 5;
    doc.text(`Responsable Asignado: ${caseData.assignedTo}`, 20, yPos);
    yPos += 15;

    // Footer de seguridad
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Este documento contiene información sensible protegida por el Código de la Niñez y la LOEI.", 20, 285);
    doc.text("La identidad del estudiante se mantiene bajo encriptación para su protección integral.", 20, 290);
    
    doc.save(`Reporte_Privado_${caseData.id}.pdf`);
    
    // Cierre oficial en sistema
    if (caseData.status !== CaseStatus.CLOSED) {
        const closedCase = { ...caseData, status: CaseStatus.CLOSED, updatedAt: new Date().toISOString() };
        saveCase(closedCase);
        addNotificationToUser(
            caseData.encryptedUserCode,
            `Caso Cerrado #${caseData.id}`,
            `El protocolo ha finalizado con éxito. Gracias por confiar en nosotros.`
        );
        onUpdate();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700 p-6 sm:p-10 space-y-10 transition-colors duration-200">
      
      {/* Header Info */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 dark:border-gray-700 pb-6">
        <div>
          <button onClick={onBack} className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-800 dark:hover:text-indigo-400 mb-2 flex items-center gap-1 transition">
            ← Volver al Panel
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Gestión de Caso: <span className="text-indigo-700 dark:text-indigo-400">{caseData.id}</span></h1>
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-tight">Usuario Código (Anónimo): {caseData.encryptedUserCode}</p>
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

      {/* 1. Resumen del conflicto */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded"></span>
          1. Resumen del Conflicto
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/40 p-6 rounded-xl text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium leading-relaxed shadow-inner">
            {caseData.summary}
        </div>
      </section>

      {/* 2. Recomendaciones para el encargado */}
      {caseData.recommendations && caseData.recommendations.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-purple-600 rounded"></span>
            2. Recomendaciones para el Encargado (IA)
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

      {/* 3. Protocolo activado */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-600 rounded"></span>
          3. Protocolo Activado
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl text-blue-900 dark:text-blue-100 border-2 border-blue-200 dark:border-blue-800 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-sm">
            <div className="bg-white dark:bg-blue-950/40 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <span className="text-[10px] uppercase font-bold text-blue-400 dark:text-blue-500">Ruta de Intervención</span>
                <p className="font-extrabold text-lg mt-1">{caseData.assignedProtocol}</p>
            </div>
            <div className="bg-white dark:bg-blue-950/40 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                <span className="text-[10px] uppercase font-bold text-blue-400 dark:text-blue-500">Autoridad a Cargo</span>
                <p className="font-extrabold text-lg mt-1">{caseData.assignedTo}</p>
            </div>
        </div>
      </section>

      {/* 4. Evidencias para Staff */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-600 rounded"></span>
          4. Repositorio de Evidencias
        </h3>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Total de evidencias cargadas: <span className="text-lg font-black ml-1">{caseData.evidence?.length || 0}</span></p>
             <button 
               onClick={() => setShowEvidence(!showEvidence)}
               className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black transition shadow-lg flex items-center gap-2 uppercase tracking-widest"
             >
                <svg className={`w-4 h-4 transition-transform duration-300 ${showEvidence ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                {showEvidence ? 'Cerrar Repositorio' : 'Acceder al Repositorio'}
             </button>
          </div>

          {showEvidence && (
            <div className="mt-6 animate-fadeIn">
                {(!caseData.evidence || caseData.evidence.length === 0) ? (
                    <div className="p-10 text-center border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold uppercase text-xs">No se han registrado evidencias para este caso.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                        {caseData.evidence.map((ev) => (
                            <div key={ev.id} className="group relative bg-white dark:bg-gray-800 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900 aspect-square flex flex-col items-center justify-center overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {ev.mimeType.startsWith('image/') ? (
                                    <img src={ev.data} alt={ev.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <svg className="w-10 h-10 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                                        <span className="text-[9px] font-black text-center break-all line-clamp-2 uppercase">{ev.name.split('.').pop()}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-emerald-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                                    <p className="text-[8px] text-white font-black text-center truncate w-full uppercase">{ev.name}</p>
                                    <a href={ev.data} download={ev.name} className="text-emerald-900 bg-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          )}
        </div>
      </section>

      {/* 5. Perfil psicográfico */}
      {linkedProfile?.psychographics && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-yellow-500 rounded"></span>
            5. Perfil Psicográfico (Análisis IA)
          </h3>
          <div className="bg-gray-900 dark:bg-black text-white rounded-2xl p-6 sm:p-8 shadow-2xl border border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Afinidades</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                          {linkedProfile.psychographics.interests.map((t, i) => <span key={i} className="text-[10px] bg-gray-800 px-3 py-1.5 rounded-lg font-bold border border-gray-700">{t}</span>)}
                      </div>
                  </div>
                  <div>
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Valores de Identidad</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                          {linkedProfile.psychographics.values?.map((t, i) => <span key={i} className="text-[10px] bg-indigo-900/40 px-3 py-1.5 rounded-lg font-bold border border-indigo-800 text-indigo-200">{t}</span>)}
                      </div>
                  </div>
                  <div>
                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Conductas Sugeridas</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                          {linkedProfile.psychographics.personalityTraits.map((t, i) => <span key={i} className="text-[10px] bg-gray-800 px-3 py-1.5 rounded-lg font-bold border border-gray-700">{t}</span>)}
                      </div>
                  </div>
              </div>
          </div>
        </section>
      )}

      {/* 6. Módulo de intervención */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-green-600 rounded"></span>
          6. Módulo de Intervención Operativa
        </h3>
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-300 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-1/3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Estatus Actual</label>
                    <select 
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as CaseStatus)}
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition"
                    >
                        {Object.values(CaseStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Describir medida adoptada</label>
                    <textarea
                        className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl p-4 text-sm focus:border-indigo-500 outline-none font-medium transition"
                        rows={3}
                        placeholder="Registro de hitos: entrevista, notificación a junta, etc."
                        value={interventionNote}
                        onChange={(e) => setInterventionNote(e.target.value)}
                    />
                </div>
            </div>
            <button 
                onClick={handleAddIntervention}
                disabled={!interventionNote}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl text-sm font-extrabold transition shadow-lg border border-green-800 uppercase tracking-widest disabled:opacity-50"
            >
                Actualizar Bitácora del Caso
            </button>
        </div>
      </section>

      {/* 7. Comunicación directa */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-cyan-500 rounded"></span>
          7. Comunicación Directa e Historial de Mensajes
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Solicitar Información Adicional</span>
                </div>
                <textarea
                    className="w-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 rounded-xl p-4 text-sm focus:border-cyan-500 outline-none font-medium shadow-sm"
                    rows={4}
                    placeholder="El mensaje se enviará al buzón privado del usuario."
                    value={messageToUser}
                    onChange={(e) => setMessageToUser(e.target.value)}
                />
                <button 
                    onClick={handleSendMessageToUser}
                    disabled={!messageToUser}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-xl text-xs font-extrabold transition border border-cyan-800 uppercase tracking-widest shadow-md disabled:opacity-50"
                >
                    Notificar al Usuario
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col h-full">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Registro de Intercambios</span>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {linkedProfile?.notifications?.filter(n => n.relatedCaseId === caseData.id && n.type === 'REQUEST').length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic text-sm font-bold">Sin mensajes directos registrados.</div>
                    ) : (
                        linkedProfile?.notifications?.filter(n => n.relatedCaseId === caseData.id && n.type === 'REQUEST').map(msg => (
                            <div key={msg.id} className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-extrabold text-cyan-700 dark:text-cyan-400 uppercase tracking-tighter">Enviado: {new Date(msg.date).toLocaleDateString()}</span>
                                    {msg.reply ? <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-bold">CON RESPUESTA</span> : <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[9px] font-bold">ESPERANDO</span>}
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 font-bold mb-3">"{msg.message}"</p>
                                
                                {msg.reply && (
                                    <div className="mt-3 pl-3 border-l-2 border-green-500 bg-white dark:bg-gray-900/40 p-3 rounded-r-lg">
                                        <p className="text-[9px] font-bold text-green-600 uppercase mb-1">Respuesta del Usuario:</p>
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

      {/* 8. Historial de acciones */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-gray-600 rounded"></span>
          8. Historial de Acciones (Auditoría de Bitácora)
        </h3>
        {caseData.interventions.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/30 p-10 rounded-2xl text-center text-gray-400 font-bold border border-dashed border-gray-300 dark:border-gray-700 uppercase tracking-widest text-sm">
                Sin registros en el historial.
            </div>
        ) : (
            <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                {caseData.interventions.slice().reverse().map((rec, index) => (
                    <div key={rec.id} className={`flex items-start gap-6 p-5 transition hover:bg-gray-50 dark:hover:bg-gray-700/30 ${index !== caseData.interventions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
                        <div className="shrink-0 flex flex-col items-center">
                            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">{new Date(rec.date).toLocaleDateString()}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(rec.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">{rec.actionTaken}</p>
                            <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-widest">Registrado por: {rec.responsible}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* Footer Final Actions */}
      <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 11.388c-.51-.465-.45-1.32.135-1.691l9.13-5.783a1.125 1.125 0 011.63 1.054v10.063a1.125 1.125 0 01-1.63 1.054l-9.13-5.783zM11.25 11.388c-.51-.465-.45-1.32.135-1.691l9.13-5.783a1.125 1.125 0 011.63 1.054v10.063a1.125 1.125 0 01-1.63 1.054l-9.13-5.783z" clipRule="evenodd" /></svg>
            <p className="text-xs text-gray-500 font-bold max-w-sm">La protección de la identidad es absoluta. El reporte PDF utilizará solo identificadores encriptados.</p>
        </div>
        <button
            onClick={handleGenerateReport}
            className="flex items-center gap-3 bg-indigo-900 dark:bg-black text-white px-10 py-5 rounded-2xl hover:bg-black dark:hover:bg-indigo-800 transition-all shadow-2xl font-extrabold border border-indigo-700 group"
        >
            <svg className="w-6 h-6 text-yellow-500 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            CERRAR CASO & GENERAR PDF ANÓNIMO
        </button>
      </div>
    </div>
  );
};

export default CaseDetail;
