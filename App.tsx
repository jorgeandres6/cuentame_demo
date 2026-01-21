
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import { MessagingInterface } from './components/MessagingInterface';
import { UserRole, UserProfile, ConflictCase, RiskLevel, CaseStatus, CaseEvidence } from './types';
import { 
    saveUserProfile, 
    getCases, 
    loginUserByCredentials, 
    replyToNotification, 
    registerNewUser, 
    verifySystemGateCredentials,
    registerSystemGateUser,
    getSystemGateUsers,
    getGateLoginLogs,
    recordGateLogin,
    getCasesByUserCode,
    getUserNotifications,
    DemoGateUser,
    GateLoginLog,
    saveCase
} from './services/storageService';

const TERMS_AND_CONDITIONS_TEXT = `Términos y Condiciones de Uso de CUENTAME
Fecha de Última Actualización: 11 de diciembre de 2025

1. Aceptación de los Términos de Uso
Al acceder y utilizar la plataforma CUENTAME, usted acepta cumplir con estos términos y condiciones. Esta plataforma está diseñada exclusivamente para la gestión confidencial de conflictos escolares en el marco de la normativa vigente en Ecuador.

2. Privacidad y Confidencialidad
CUENTAME utiliza un sistema de encriptación de identidades. Los nombres reales de los estudiantes no son almacenados en el repositorio de casos, utilizando códigos alfanuméricos únicos para garantizar el derecho a la intimidad.

3. Uso Responsable
El usuario se compromete a proporcionar información veraz y a no utilizar la plataforma para fines malintencionados o falsas denuncias.`;

const TermsModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-700 animate-fadeIn">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-2xl">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Términos y Condiciones</h3>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white bg-gray-200 dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
            </div>
            <div className="p-8 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white dark:bg-gray-800">
                {TERMS_AND_CONDITIONS_TEXT}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg">Entendido, cerrar</button>
            </div>
        </div>
    </div>
);

const SystemGateScreen = ({ onUnlock }: { onUnlock: (username: string) => void }) => {
    const [creds, setCreds] = useState({ user: '', pass: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleSystemLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 500));
        if (verifySystemGateCredentials(creds.user, creds.pass)) {
            await recordGateLogin(creds.user);
            setIsLoading(false);
            onUnlock(creds.user);
        } else {
            setIsLoading(false);
            setError('Credenciales incorrectas.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700 flex flex-col">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">CUÉNTAME</h1>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Acceso al Sistema Demo</p>
                </div>
                <form onSubmit={handleSystemLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Usuario del Sistema</label>
                        <input 
                            type="text" 
                            className="w-full bg-white dark:bg-gray-950 border-2 border-gray-400 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white font-black focus:border-indigo-500 outline-none transition" 
                            placeholder="" 
                            value={creds.user} 
                            onChange={e => setCreds({...creds, user: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Clave de Acceso</label>
                        <input 
                            type="password" 
                            className="w-full bg-white dark:bg-gray-950 border-2 border-gray-400 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white font-black focus:border-indigo-500 outline-none transition" 
                            placeholder="" 
                            value={creds.pass} 
                            onChange={e => setCreds({...creds, pass: e.target.value})} 
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm font-bold text-center">{error}</p>}
                    <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg transition transform hover:scale-[1.02]">DESBLOQUEAR SISTEMA</button>
                </form>
                <div className="mt-8 text-center text-gray-500 text-[10px] font-bold">
                    <p>Demo Key: cuentame2026 / Cu3nt@m3</p>
                </div>
                <div className="mt-8 text-center"><button onClick={() => setShowTerms(true)} className="text-indigo-400 text-xs font-bold hover:underline">Términos y Condiciones</button></div>
            </div>
        </div>
    );
};

const DemoAccessModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'CREATE' | 'LIST' | 'AUDIT'>('CREATE');
    const [form, setForm] = useState({ username: '', password: '', label: '' });
    const [gateUsers, setGateUsers] = useState<DemoGateUser[]>([]);
    const [auditLogs, setAuditLogs] = useState<GateLoginLog[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (activeTab === 'LIST') setGateUsers(getSystemGateUsers());
        else if (activeTab === 'AUDIT') setAuditLogs(getGateLoginLogs());
    }, [activeTab]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        registerSystemGateUser(form.username, form.password, form.label);
        setSuccessMsg('Creado.');
        setForm({ username: '', password: '', label: '' });
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-2 border-orange-500 relative flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 font-bold">✕</button>
                <h3 className="text-2xl font-bold mb-6 dark:text-white">Administrar Demo</h3>
                <div className="flex gap-2 mb-6">
                    <button onClick={() => setActiveTab('CREATE')} className={`flex-1 p-2 rounded ${activeTab === 'CREATE' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Crear</button>
                    <button onClick={() => setActiveTab('LIST')} className={`flex-1 p-2 rounded ${activeTab === 'LIST' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Lista</button>
                    <button onClick={() => setActiveTab('AUDIT')} className={`flex-1 p-2 rounded ${activeTab === 'AUDIT' ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Auditoría</button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {activeTab === 'CREATE' && (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" placeholder="Etiqueta" value={form.label} onChange={e => setForm({...form, label: e.target.value})} />
                            <input className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" placeholder="Usuario" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                            <input className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" placeholder="Pass" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                            <button className="w-full bg-orange-600 text-white p-3 rounded font-bold">Guardar</button>
                        </form>
                    )}
                    {activeTab === 'LIST' && gateUsers.map(u => <div key={u.id} className="p-3 border-b dark:text-white">{u.label}: {u.username}</div>)}
                    {activeTab === 'AUDIT' && auditLogs.map(l => <div key={l.id} className="p-2 border-b text-xs dark:text-gray-300">{l.username} - {l.timestamp} - {l.ip}</div>)}
                </div>
            </div>
        </div>
    );
};

const UserGeneratorModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'CREATE' | 'LIST'>('CREATE');
    const [form, setForm] = useState({ name: '', role: UserRole.STUDENT, pass: '', grade: '' });
    const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);
    const [userList, setUserList] = useState<UserProfile[]>([]);

    useEffect(() => {
        // Los usuarios ahora se almacenan en Azure SQL
        // Esta sección es solo para demostración
    }, [activeTab, createdUser]); 

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const newUser = await registerNewUser(form.name, form.role, form.pass, form.grade);
        setCreatedUser(newUser);
        setForm({ name: '', role: UserRole.STUDENT, pass: '', grade: '' });
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4">✕</button>
                <h3 className="text-2xl font-bold mb-6 dark:text-white">Usuarios Actores</h3>
                <div className="flex gap-2 mb-6">
                    <button onClick={() => {setActiveTab('CREATE'); setCreatedUser(null);}} className={`flex-1 p-2 rounded ${activeTab === 'CREATE' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Nuevo</button>
                    <button onClick={() => setActiveTab('LIST')} className={`flex-1 p-2 rounded ${activeTab === 'LIST' ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>Lista</button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {activeTab === 'CREATE' && !createdUser && (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" placeholder="Nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                            <select className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <input className="w-full p-3 border-2 rounded dark:bg-gray-800 dark:text-white font-bold" placeholder="Pass" value={form.pass} onChange={e => setForm({...form, pass: e.target.value})} />
                            <button className="w-full bg-indigo-600 text-white p-3 rounded font-bold">Crear</button>
                        </form>
                    )}
                    {createdUser && <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded dark:text-white text-center">Código: {createdUser.encryptedCode}</div>}
                    {activeTab === 'LIST' && userList.map(u => <div key={u.id} className="p-2 border-b text-sm dark:text-white">{u.fullName} - {u.encryptedCode}</div>)}
                </div>
            </div>
        </div>
    );
};

const AuthScreen = ({ onLogin }: { onLogin: (u: UserProfile) => void }) => {
  const [formData, setFormData] = useState({ code: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    { role: 'ESTUDIANTE', code: 'EST-2026-A', pass: '123', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' },
    { role: 'FAMILIA', code: 'FAM-2026-B', pass: '123', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300' },
    { role: 'DOCENTE', code: 'DOC-2026-C', pass: '123', color: 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800 dark:text-cyan-300' },
    { role: 'ADMIN', code: 'ADM-2026-MASTER', pass: 'admin', color: 'text-gray-900 bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white' },
    { role: 'STAFF', code: 'STAFF-2026-PSI', pass: 'staff', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300' },
  ];

  const fillDemo = (code: string, pass: string) => {
    setFormData({ code, password: pass });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const u = await loginUserByCredentials(formData.code, formData.password);
      setIsLoading(false);
      if (u) {
        onLogin(u);
      } else {
        setError('Código o contraseña incorrectos.');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Error al conectar. Intenta de nuevo.');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-8 animate-fadeIn">
        <div className="bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl border border-gray-300 dark:border-gray-700">
            <h2 className="text-3xl font-extrabold text-center dark:text-white mb-8 tracking-tight">Acceso Seguro</h2>
            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1">Código Único Institucional</label>
                    <input 
                        required 
                        className="w-full p-4 border-2 border-gray-400 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white uppercase font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none placeholder-gray-400" 
                        placeholder="EJ: EST-2026-A" 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value})}
                        disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1">Contraseña</label>
                    <input 
                        required 
                        type="password" 
                        className="w-full p-4 border-2 border-gray-400 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition outline-none placeholder-gray-400" 
                        placeholder="••••••••" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        disabled={isLoading}
                    />
                </div>
                {error && <p className="text-red-600 dark:text-red-400 text-center font-bold text-sm bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
                <button 
                  disabled={isLoading}
                  className="w-full bg-indigo-700 text-white p-4 rounded-2xl font-black text-lg hover:bg-indigo-800 transition-all shadow-lg transform active:scale-95 uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? 'Conectando...' : 'Ingresar al Sistema'}
                </button>
            </form>
        </div>

        {/* Demo Credentials Helper */}
        <div className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-3xl border border-dashed border-gray-400 dark:border-gray-700">
            <h3 className="text-center text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-[0.2em] mb-6">Acceso Rápido para Demostración</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {demoAccounts.map((acc, idx) => (
                    <button 
                        key={idx}
                        onClick={() => fillDemo(acc.code, acc.pass)}
                        disabled={isLoading}
                        className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 text-left flex flex-col gap-1 shadow-sm group ${acc.color} disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                        <span className="text-[9px] font-black uppercase opacity-60 tracking-wider">{acc.role}</span>
                        <span className="text-xs font-bold font-mono tracking-tighter">{acc.code}</span>
                        <div className="flex justify-between items-center mt-2">
                             <span className="text-[10px] font-bold opacity-60">Pass: {acc.pass}</span>
                             <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

const NotificationCard: React.FC<{ note: any; userCode: string; onReplied: (updatedUser: UserProfile) => void }> = ({ note, userCode, onReplied }) => {
    const [replyText, setReplyText] = useState('');
    const handleReply = () => { const u = replyToNotification(userCode, note.id, replyText); if (u) onReplied(u); };
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 relative">
            <h4 className="font-bold dark:text-white">{note.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{note.message}</p>
            {note.type === 'REQUEST' && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {note.reply ? <div className="text-xs text-green-600 font-bold">Respuesta: {note.reply}</div> : (
                        <div className="space-y-2">
                            <textarea className="w-full p-2 text-sm rounded border dark:bg-gray-800 dark:text-white" placeholder="Tu respuesta..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                            <button onClick={handleReply} className="bg-indigo-600 text-white text-xs p-2 rounded">Responder</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const UserCaseDetailView: React.FC<{ caseData: ConflictCase; onBack: () => void }> = ({ caseData, onBack }) => {
    const [currentCase, setCurrentCase] = useState<ConflictCase>(caseData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const steps = [
        { label: 'Recepción', status: CaseStatus.OPEN, color: 'bg-blue-500' },
        { label: 'Análisis', status: CaseStatus.IN_PROGRESS, color: 'bg-amber-500' },
        { label: 'Intervención', status: CaseStatus.RESOLVED, color: 'bg-indigo-500' },
        { label: 'Cierre', status: CaseStatus.CLOSED, color: 'bg-emerald-500' }
    ];

    const currentStepIndex = steps.findIndex(s => s.status === currentCase.status);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Data = event.target?.result as string;
            const newEvidence: CaseEvidence = {
                id: Date.now().toString(),
                name: file.name,
                mimeType: file.type,
                data: base64Data,
                date: new Date().toISOString()
            };

            const updatedCase = {
                ...currentCase,
                evidence: [...(currentCase.evidence || []), newEvidence]
            };

            setCurrentCase(updatedCase);
            saveCase(updatedCase);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center border-b pb-4">
                <button onClick={onBack} className="text-sm font-bold text-gray-500 hover:text-indigo-600">← Mis Casos</button>
                <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Expediente</span>
                    <h3 className="text-lg font-extrabold dark:text-white">{currentCase.id}</h3>
                </div>
            </div>

            {/* Stepper Proceso */}
            <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2"></div>
                <div className="relative flex justify-between">
                    {steps.map((step, i) => (
                        <div key={i} className="flex flex-col items-center z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md transition-all duration-500 ${i <= currentStepIndex ? step.color : 'bg-gray-300 dark:bg-gray-600'}`}>
                                {i < currentStepIndex ? <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg> : null}
                            </div>
                            <span className={`text-[10px] mt-2 font-bold uppercase tracking-tighter ${i <= currentStepIndex ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Detalles del Caso */}
            <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-900/40 p-5 rounded-xl border dark:border-gray-700">
                    <h4 className="text-xs font-extrabold uppercase text-gray-400 mb-2">Resumen Registrado</h4>
                    <p className="text-sm dark:text-gray-300 leading-relaxed italic">"{currentCase.summary}"</p>
                </div>
            </div>

            {/* Evidencias */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-extrabold uppercase text-gray-500 tracking-widest">Evidencias del Caso</h4>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-200 transition shadow-sm border border-indigo-200 dark:border-indigo-800 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        CARGAR EVIDENCIAS
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                </div>
                
                {(!currentCase.evidence || currentCase.evidence.length === 0) ? (
                    <div className="p-8 text-center border-2 border-dashed rounded-xl text-gray-400 font-bold uppercase text-xs">No se han subido archivos de evidencia.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {currentCase.evidence.map((ev) => (
                            <div key={ev.id} className="group relative bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 aspect-square flex flex-col items-center justify-center overflow-hidden">
                                {ev.mimeType.startsWith('image/') ? (
                                    <img src={ev.data} alt={ev.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                        <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                                        <span className="text-[8px] font-bold text-center break-all line-clamp-2">{ev.name}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <a href={ev.data} download={ev.name} className="text-white bg-indigo-600 p-2 rounded-full shadow-lg">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bitácora para el Usuario */}
            <div className="space-y-4">
                <h4 className="text-sm font-extrabold uppercase text-gray-500 tracking-widest">Estado de Actuaciones</h4>
                {currentCase.interventions.length === 0 ? (
                    <div className="p-10 text-center border-2 border-dashed rounded-xl text-gray-400 font-bold uppercase text-xs">Aún no se registran acciones oficiales.</div>
                ) : (
                    <div className="space-y-3">
                        {currentCase.interventions.slice().reverse().map((int) => (
                            <div key={int.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse"></div>
                                <div>
                                    <p className="text-xs font-bold text-gray-400 mb-1">{new Date(int.date).toLocaleDateString()}</p>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{int.actionTaken}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const UserView: React.FC<{ 
    user: UserProfile; 
    viewState: 'HOME' | 'CHAT_SUCCESS'; 
    onCaseSubmitted: (c: ConflictCase) => void; 
    onReset: () => void 
}> = ({ user, viewState, onCaseSubmitted, onReset }) => {
    const [activeTab, setActiveTab] = useState<'CHAT' | 'NOTIFICATIONS' | 'CASES'>('CHAT');
    const [localUser, setLocalUser] = useState<UserProfile>(user);
    const [selectedUserCase, setSelectedUserCase] = useState<ConflictCase | null>(null);

    useEffect(() => { setLocalUser(user); }, [user]);
    const handleUserUpdate = (u: UserProfile) => { setLocalUser(u); };
    const notificationCount = localUser.notifications?.filter(n => !n.read).length || 0;

    // 🔧 NUEVO: Efecto para recargar notificaciones cuando se abre la pestaña
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                console.log(`🔄 [UserView] Recargando notificaciones para ${localUser.encryptedCode}`);
                const notifications = await getUserNotifications(localUser.encryptedCode);
                console.log(`✅ [UserView] Obtenidas ${notifications.length} notificaciones`);
                setLocalUser(prev => ({
                    ...prev,
                    notifications: notifications
                }));
            } catch (error) {
                console.error('❌ [UserView] Error cargando notificaciones:', error);
            }
        };

        // Solo cargar cuando activeTab es NOTIFICATIONS
        if (activeTab === 'NOTIFICATIONS') {
            loadNotifications();
            // Recargar cada 5 segundos mientras estamos en la pestaña
            const interval = setInterval(loadNotifications, 5000);
            return () => clearInterval(interval);
        }
    }, [activeTab, localUser.encryptedCode]);

    const [myCases, setMyCases] = useState<ConflictCase[]>([]);
    useEffect(() => {
    const fetchMyCases = async () => {
        const data = await getCasesByUserCode(localUser.encryptedCode);
        setMyCases(data);
    };
    fetchMyCases();
    }, [localUser.encryptedCode, activeTab, viewState]);

    //const myCases = useMemo(() => getCasesByUserCode(localUser.encryptedCode), [localUser.encryptedCode, activeTab, viewState]);

    if (viewState === 'CHAT_SUCCESS') {
         return (
          <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl mt-12 border-2 border-emerald-500">
            <h2 className="text-3xl font-extrabold dark:text-white mb-4">Reporte Registrado</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">Su reporte ha sido ingresado exitosamente al sistema bajo estricta confidencialidad.</p>
            <button onClick={() => { onReset(); setActiveTab('CASES'); }} className="text-indigo-700 dark:text-indigo-400 font-bold hover:underline text-lg">Ir a Mis Casos</button>
          </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-extrabold dark:text-white">Hola,</h2>
                    <p className="text-lg text-gray-500 font-medium tracking-tight">Bienvenido a tu Espacio Seguro.</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identificador</p>
                    <span className="font-mono text-xs font-black bg-indigo-600 text-white px-2 py-1 rounded">{localUser.encryptedCode}</span>
                </div>
            </div>

            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6 shadow-inner">
                <button onClick={() => { setActiveTab('CHAT'); setSelectedUserCase(null); }} className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition flex justify-center items-center gap-2 ${activeTab === 'CHAT' ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    Nuevo Reporte
                </button>
                <button onClick={() => { setActiveTab('CASES'); setSelectedUserCase(null); }} className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition flex justify-center items-center gap-2 ${activeTab === 'CASES' ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Mis Casos ({myCases.length})
                </button>
                <button onClick={() => { setActiveTab('NOTIFICATIONS'); setSelectedUserCase(null); }} className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold transition flex justify-center items-center gap-2 ${activeTab === 'NOTIFICATIONS' ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-md' : 'text-gray-500 hover:text-gray-800'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Buzón {notificationCount > 0 && <span className="bg-red-500 text-white text-[9px] px-1 rounded-full">{notificationCount}</span>}
                </button>
            </div>

            <div className="animate-fadeIn">
                {activeTab === 'CHAT' && <ChatInterface user={localUser} onCaseSubmitted={onCaseSubmitted} />}

                {activeTab === 'CASES' && (
                    <div className="space-y-4">
                        {selectedUserCase ? (
                            <UserCaseDetailView caseData={selectedUserCase} onBack={() => setSelectedUserCase(null)} />
                        ) : (
                            <>
                                {myCases.length === 0 ? (
                                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <h4 className="text-xl font-bold dark:text-white">Aún no has registrado casos</h4>
                                        <p className="text-gray-500 text-sm mt-2">Usa la pestaña de "Nuevo Reporte" para informar una situación.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {myCases && Array.isArray(myCases) && myCases.map(c => (
                                            <div 
                                                key={c.id} 
                                                onClick={() => setSelectedUserCase(c)}
                                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-500 cursor-pointer group transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{c.typology}</span>
                                                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">Exp. {c.id}</h3>
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                                                        c.status === CaseStatus.OPEN ? 'bg-blue-100 text-blue-700' :
                                                        c.status === CaseStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-700' :
                                                        c.status === CaseStatus.RESOLVED ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {c.status}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex justify-between items-center text-xs font-bold text-gray-400">
                                                    <span>Iniciado: {new Date(c.createdAt).toLocaleDateString()}</span>
                                                    <span className="text-indigo-600 group-hover:translate-x-1 transition-transform uppercase tracking-widest">Ver Seguimiento &rarr;</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'NOTIFICATIONS' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[400px]">
                        <h3 className="text-xl font-bold dark:text-white mb-6">Buzón de Mensajes</h3>
                        <div className="space-y-4">
                        {localUser.notifications?.length > 0 ? localUser.notifications?.map(n => <NotificationCard key={n.id} note={n} userCode={localUser.encryptedCode} onReplied={handleUserUpdate} />) : <div className="text-center py-20 text-gray-400">No hay mensajes.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [systemUnlocked, setSystemUnlocked] = useState(false);
  const [currentSystemUser, setCurrentSystemUser] = useState<string>(''); 
  const [showUserGenerator, setShowUserGenerator] = useState(false);
  const [showDemoAccessManager, setShowDemoAccessManager] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedCase, setSelectedCase] = useState<ConflictCase | null>(null);
  const [viewState, setViewState] = useState<'HOME' | 'CHAT_SUCCESS' | 'MESSAGES'>('HOME');
  const [darkMode, setDarkMode] = useState(false);
  const [allCases, setAllCases] = useState<ConflictCase[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState(false);

  useEffect(() => { if (darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }, [darkMode]);
  
  // Función para recargar casos
  const refreshCases = async () => {
    setIsLoadingCases(true);
    const cases = await getCases();
    setAllCases(cases);
    setIsLoadingCases(false);
  };

  // Cargar casos cuando cambia el viewState
  useEffect(() => {
    refreshCases();
  }, [viewState]);

  const activeCase = useMemo(() => { if (!selectedCase) return null; return allCases.find(c => c.id === selectedCase.id) || selectedCase; }, [selectedCase, allCases]);
  const handleLogout = () => { setCurrentUser(null); setSelectedCase(null); setViewState('HOME'); };

  if (!systemUnlocked) return <SystemGateScreen onUnlock={(username) => { setSystemUnlocked(true); setCurrentSystemUser(username); }} />;

  return (
    <>
      <div className="bg-black text-white px-4 py-2 text-[10px] font-black flex justify-between items-center z-50 sticky top-0 gap-2 shadow-2xl">
          <div className="flex items-center gap-3">
              <span className="text-yellow-500 tracking-widest">● MODO DEMOSTRACIÓN</span>
              <button onClick={() => { setSystemUnlocked(false); handleLogout(); }} className="bg-gray-800 hover:bg-red-900 px-3 py-1 rounded border border-gray-700 transition uppercase tracking-tighter">Bloquear</button>
          </div>
          <div className="flex gap-2">
            {currentSystemUser === 'cuentame2026' && <button onClick={() => setShowDemoAccessManager(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-md transition shadow-lg border border-orange-400 uppercase">Administrar Demo</button>}
            <button onClick={() => setShowUserGenerator(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md transition shadow-lg border border-indigo-400 uppercase">Usuarios Demos</button>
          </div>
      </div>
      {showDemoAccessManager && <DemoAccessModal onClose={() => setShowDemoAccessManager(false)} />}
      {showUserGenerator && <UserGeneratorModal onClose={() => setShowUserGenerator(false)} />}

      {!currentUser ? (
        <Layout onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <div className="text-center mb-12 mt-4">
              <h1 className="text-6xl font-black text-gray-900 dark:text-white mb-2 tracking-tighter"><span className="text-indigo-800 dark:text-indigo-400">CUÉNTAME</span></h1>
              <p className="text-xl font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Atención y Gestión de Conflictos</p>
          </div>
          <AuthScreen onLogin={setCurrentUser} />
        </Layout>
      ) : currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.PARENT || currentUser.role === UserRole.TEACHER ? (
        <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <UserView user={currentUser} viewState={viewState} onCaseSubmitted={() => setViewState('CHAT_SUCCESS')} onReset={() => setViewState('HOME')} />
        </Layout>
      ) : (
        <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setViewState('HOME')}
              className={`px-4 py-2 rounded font-bold transition ${
                viewState === 'HOME'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setViewState('MESSAGES')}
              className={`px-4 py-2 rounded font-bold transition ${
                viewState === 'MESSAGES'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300'
              }`}
            >
              💬 Mensajes
            </button>
          </div>
          {viewState === 'MESSAGES' ? (
            <MessagingInterface 
              userCode={currentUser.encryptedCode}
              userRole={currentUser.role}
              isStaff={currentUser.role === UserRole.STAFF || currentUser.role === UserRole.ADMIN}
            />
          ) : activeCase ? (
            <CaseDetail caseData={activeCase} userCode={currentUser.encryptedCode} onBack={() => { setSelectedCase(null); refreshCases(); }} onUpdate={() => refreshCases()} />
          ) : (
            <Dashboard cases={allCases} onSelectCase={setSelectedCase} />
          )}
        </Layout>
      )}
    </>
  );
};

export default App;
