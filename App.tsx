
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import { UserRole, UserProfile, ConflictCase, RiskLevel } from './types';
import { 
    saveUserProfile, 
    getCases, 
    loginUserByCredentials, 
    replyToNotification, 
    registerNewUser, 
    getUsers,
    verifySystemGateCredentials,
    registerSystemGateUser,
    getSystemGateUsers,
    getGateLoginLogs,
    recordGateLogin,
    DemoGateUser,
    GateLoginLog
} from './services/storageService';

// --- TERMS CONTENT ---
const TERMS_AND_CONDITIONS_TEXT = `Términos y Condiciones de Uso de CUENTAME
Fecha de Última Actualización: 11 de diciembre de 2025

1. Aceptación de los Términos
Al acceder, navegar o utilizar la plataforma virtual CUENTAME (en adelante, "la Plataforma"), usted, el "Usuario", acepta incondicionalmente y se obliga a cumplir los presentes Términos y Condiciones de Uso (los "Términos") y todas las leyes y regulaciones aplicables en la República del Ecuador. Si no está de acuerdo con estos Términos, no debe usar la Plataforma.

2. Descripción del Servicio
La Plataforma CUENTAME es un servicio virtual diseñado para la Atención y Resolución de Conflictos en Establecimientos Educativos. Los servicios son prestados por profesionales y equipos DECE, y tienen un carácter de apoyo, orientación e intervención inicial, no sustituyendo la atención médica, psicológica, psiquiátrica o legal profesional especializada.

3. Elegibilidad y Registro
• Elegibilidad: El uso de la Plataforma está dirigido a estudiantes, docentes, familiares/representantes legales de estudiantes, equipo del DECE y autoridades del plantel educativo.
• Edad Mínima: Los Usuarios deben ser mayores de dieciocho (18) años. Si el Usuario es menor de 18 años (con edad mínima de 6 años), debe contar con la supervisión y consentimiento expreso de su padre, madre o representante legal, quien será el responsable directo por el uso de la cuenta y la veracidad de la información proporcionada.
• Cuenta de Usuario: El Usuario es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta. Debe notificar inmediatamente a la Administración sobre cualquier uso no autorizado.

4. Conducta del Usuario y Contenido
• El Usuario se compromete a utilizar la Plataforma de manera respetuosa y legal.
• Está estrictamente prohibido: enviar contenido ofensivo, discriminatorio, amenazante, ilegal o que incite a la violencia; suplantar la identidad de otra persona; o intentar interferir con el funcionamiento de la Plataforma.
• La Plataforma se reserva el derecho de eliminar, sin previo aviso, cualquier contenido que infrinja estos Términos y/o suspender o cancelar la cuenta del Usuario.

5. Limitación de Responsabilidad
CUENTAME y sus proveedores de servicio no serán responsables por daños directos, indirectos, incidentales, consecuentes o especiales que surjan del uso o la incapacidad de usar el servicio. El servicio se proporciona "tal cual" y sin garantías de resultado específico en la resolución de conflictos.

6. Cláusulas de Confidencialidad y No Plagio

A. Confidencialidad de las Comunicaciones (Regulación Ecuatoriana)
1. Carácter Confidencial: Toda la información personal, datos sensibles, detalles de conflictos y comunicaciones compartidas por el Usuario dentro de las sesiones de orientación o soporte son consideradas información confidencial.
2. Uso Exclusivo: La información confidencial del Usuario será utilizada exclusivamente para el propósito de prestar el servicio de apoyo, orientación y resolución de conflictos dentro del ámbito educativo.
3. Límites a la Confidencialidad (Deber de Revelación): La confidencialidad no aplicará y la Plataforma tiene el deber de revelar información a las autoridades competentes en los siguientes casos:
   o Si existe una amenaza clara, inminente y verificable de daño grave para el propio Usuario o para terceros (riesgo de suicidio, homicidio o lesiones graves).
   o Cuando se identifique un presunto caso de violencia, abuso sexual, maltrato o negligencia contra un niño, niña o adolescente.
   o Cuando lo exija una orden judicial legítima o una ley aplicable.

B. No Plagio y Derechos de Autor
1. Propiedad Intelectual de la Plataforma: Todo el contenido de CUENTAME es propiedad de la Plataforma o sus licenciantes y está protegido por las leyes de propiedad intelectual del Ecuador.
2. Contenido del Usuario y Plagio Académico:
   o El Usuario que comparta información o documentos de naturaleza académica es el único responsable de asegurar que dicho contenido es original y no constituye plagio.
   o El uso de los servicios de CUENTAME para facilitar o cometer fraude o plagio académico está estrictamente prohibido y será motivo de suspensión inmediata de la cuenta.

7. Ley Aplicable y Jurisdicción
Estos Términos se regirán e interpretarán de acuerdo con las leyes de la República del Ecuador. Cualquier disputa que surja de estos Términos será sometida a la jurisdicción exclusiva de los tribunales competentes.

8. Modificaciones
CUENTAME se reserva el derecho de modificar estos Términos en cualquier momento. El uso continuado de la Plataforma después de la publicación de las modificaciones constituirá la aceptación de los nuevos Términos.`;

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

// --- SYSTEM GATE SCREEN (Pre-Authentication) ---
const SystemGateScreen = ({ onUnlock }: { onUnlock: (username: string) => void }) => {
    const [creds, setCreds] = useState({ user: '', pass: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const handleSystemLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        // Simular pequeño delay para UX
        await new Promise(r => setTimeout(r, 500));

        if (verifySystemGateCredentials(creds.user, creds.pass)) {
            // Record login (async, fetches IP)
            await recordGateLogin(creds.user);
            setIsLoading(false);
            onUnlock(creds.user);
        } else {
            setIsLoading(false);
            setError('Credenciales incorrectas o acceso denegado.');
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
                    <div>
                        <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">Usuario Administrador</label>
                        <input 
                            type="text" 
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                            value={creds.user}
                            onChange={e => setCreds({...creds, user: e.target.value})}
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="text-gray-400 text-xs font-bold uppercase mb-1 block">Contraseña Maestra</label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 transition"
                            value={creds.pass}
                            onChange={e => setCreds({...creds, pass: e.target.value})}
                            disabled={isLoading}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm font-bold text-center">{error}</p>}
                    <button 
                        disabled={isLoading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-lg shadow-lg transition transform hover:scale-[1.02] flex justify-center items-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'DESBLOQUEAR SISTEMA'}
                    </button>
                </form>

                {/* Disclaimer Legal */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <div className="flex gap-2 items-start text-justify">
                        <svg className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                            <span className="text-gray-400 font-bold uppercase">Aviso Legal Importante:</span><br/>
                            Al ingresar a esta plataforma, usted acepta incondicionalmente los <strong>términos, condiciones y cláusulas de confidencialidad</strong> vigentes. 
                            El uso indebido de la información o la violación de la privacidad de los datos personales puede acarrear <strong>sanciones administrativas e inclusive legales</strong> conforme a la normativa aplicable.
                            <br/>
                            <button 
                                onClick={() => setShowTerms(true)} 
                                className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer font-bold mt-1 inline-flex items-center gap-1 transition"
                            >
                                Leer Términos y Condiciones completos &rarr;
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-4 text-center text-gray-600 text-[10px]">
                    v1.0.5 - Release Candidate
                </div>
            </div>
        </div>
    );
};

// --- DEMO ACCESS MANAGER MODAL (Gate Users) ---
const DemoAccessModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'CREATE' | 'LIST' | 'AUDIT'>('CREATE');
    const [form, setForm] = useState({ username: '', password: '', label: '' });
    const [gateUsers, setGateUsers] = useState<DemoGateUser[]>([]);
    const [auditLogs, setAuditLogs] = useState<GateLoginLog[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        if (activeTab === 'LIST') {
            setGateUsers(getSystemGateUsers());
        } else if (activeTab === 'AUDIT') {
            setAuditLogs(getGateLoginLogs());
        }
    }, [activeTab]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        registerSystemGateUser(form.username, form.password, form.label);
        setSuccessMsg('Usuario de acceso creado correctamente.');
        setForm({ username: '', password: '', label: '' });
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border-2 border-orange-500 dark:border-orange-600 relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition bg-gray-100 dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center z-10 font-bold">✕</button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-xl">
                        <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Administrar Demo</h3>
                </div>
                
                <p className="text-base text-gray-600 dark:text-gray-300 mb-6 font-medium leading-relaxed">
                    Gestiona los usuarios de la <strong>pantalla de bloqueo</strong> y revisa la auditoría de accesos.
                </p>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 p-1.5 rounded-xl mb-6 shrink-0 border border-gray-300 dark:border-gray-700">
                    <button 
                        onClick={() => { setActiveTab('CREATE'); setSuccessMsg(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'CREATE' ? 'bg-white dark:bg-gray-700 text-orange-700 dark:text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'}`}
                    >
                        Crear Acceso
                    </button>
                    <button 
                         onClick={() => setActiveTab('LIST')}
                         className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'LIST' ? 'bg-white dark:bg-gray-700 text-orange-700 dark:text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'}`}
                    >
                        Ver Credenciales
                    </button>
                    <button 
                         onClick={() => setActiveTab('AUDIT')}
                         className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${activeTab === 'AUDIT' ? 'bg-white dark:bg-gray-700 text-orange-700 dark:text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'}`}
                    >
                        Auditoría
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {activeTab === 'CREATE' && (
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Etiqueta (Descripción)</label>
                                <input 
                                    required 
                                    type="text" 
                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition font-medium placeholder-gray-400 dark:placeholder-gray-500" 
                                    placeholder="Ej. Invitado Ministerio" 
                                    value={form.label} 
                                    onChange={e => setForm({...form, label: e.target.value})} 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Usuario</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition font-medium placeholder-gray-400 dark:placeholder-gray-500" 
                                        placeholder="user1" 
                                        value={form.username} 
                                        onChange={e => setForm({...form, username: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Contraseña</label>
                                    <input 
                                        required 
                                        type="text" 
                                        className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition font-medium placeholder-gray-400 dark:placeholder-gray-500" 
                                        placeholder="pass123" 
                                        value={form.password} 
                                        onChange={e => setForm({...form, password: e.target.value})} 
                                    />
                                </div>
                            </div>
                            {successMsg && (
                                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <p className="text-green-700 dark:text-green-300 font-bold text-sm">{successMsg}</p>
                                </div>
                            )}
                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg transition transform hover:-translate-y-0.5 border border-orange-700">
                                Registrar Acceso
                            </button>
                        </form>
                    )}

                    {activeTab === 'LIST' && (
                        <div className="space-y-3">
                            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-300 dark:border-gray-600 opacity-80 hover:opacity-100 transition">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-extrabold text-sm text-gray-800 dark:text-gray-100">Admin Maestro (Default)</span>
                                    <span className="text-[10px] uppercase font-bold bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded">Sistema</span>
                                </div>
                                <div className="text-xs mt-2 font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-between">
                                    <span>U: <strong>cuentame2026</strong></span>
                                    <span>P: <strong>Cu3nt@m3</strong></span>
                                </div>
                            </div>
                            {gateUsers.length > 0 ? (
                                gateUsers.map(u => (
                                    <div key={u.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm hover:border-orange-300 dark:hover:border-orange-700 transition">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{u.label}</span>
                                            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">{new Date(u.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs mt-2 font-mono text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700 flex justify-between">
                                            <span>U: <strong className="text-indigo-600 dark:text-indigo-400">{u.username}</strong></span>
                                            <span>P: <strong className="text-gray-900 dark:text-white">{u.password}</strong></span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400 italic">
                                    No hay usuarios adicionales creados.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'AUDIT' && (
                        <div className="space-y-0">
                            <div className="bg-gray-100 dark:bg-gray-800/50 p-2 rounded-t-lg border-b border-gray-300 dark:border-gray-700 grid grid-cols-12 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                                <div className="col-span-4 pl-2">Usuario</div>
                                <div className="col-span-4">Fecha/Hora</div>
                                <div className="col-span-4 text-right pr-2">IP Acceso</div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-b-lg border border-gray-300 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 max-h-[300px] overflow-y-auto">
                                {auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="grid grid-cols-12 p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                            <div className="col-span-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                {log.username}
                                            </div>
                                            <div className="col-span-4 text-gray-600 dark:text-gray-300 text-xs flex items-center">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </div>
                                            <div className="col-span-4 text-right font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                                {log.ip}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 italic text-sm">
                                        No hay registros de auditoría disponibles.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- USER GENERATOR MODAL (Actors) ---
const UserGeneratorModal = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'CREATE' | 'LIST'>('CREATE');
    const [form, setForm] = useState({ name: '', role: UserRole.STUDENT, pass: '', grade: '' });
    const [createdUser, setCreatedUser] = useState<UserProfile | null>(null);
    const [userList, setUserList] = useState<UserProfile[]>([]);

    useEffect(() => {
        if (activeTab === 'LIST') {
            setUserList(getUsers());
        }
    }, [activeTab, createdUser]); 

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const newUser = registerNewUser(form.name, form.role, form.pass, form.grade);
        setCreatedUser(newUser);
        setForm({ name: '', role: UserRole.STUDENT, pass: '', grade: '' });
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-gray-200 dark:border-gray-600 relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-green-400 to-indigo-500"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition bg-gray-100 dark:bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center z-10">✕</button>
                
                <div className="flex items-center gap-3 mb-6">
                     <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">Usuarios Demos (Actores)</h3>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Crea perfiles ficticios (Estudiantes, Docentes, Padres) para interactuar con la plataforma.
                </p>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6 shrink-0">
                    <button 
                        onClick={() => { setActiveTab('CREATE'); setCreatedUser(null); }}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'CREATE' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Crear Nuevo
                    </button>
                    <button 
                         onClick={() => setActiveTab('LIST')}
                         className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'LIST' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                    >
                        Ver Lista Completa
                    </button>
                </div>

                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {activeTab === 'CREATE' && (
                        <>
                            {!createdUser ? (
                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Nombre Completo</label>
                                        <input 
                                            required 
                                            type="text" 
                                            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium" 
                                            placeholder="Ej. Juan Pérez"
                                            value={form.name} 
                                            onChange={e => setForm({...form, name: e.target.value})} 
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Rol</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium appearance-none" 
                                                    value={form.role} 
                                                    onChange={e => setForm({...form, role: e.target.value as UserRole})}
                                                >
                                                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
                                            <input 
                                                required 
                                                type="text" 
                                                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium" 
                                                placeholder="123456"
                                                value={form.pass} 
                                                onChange={e => setForm({...form, pass: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    {form.role === UserRole.STUDENT && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Grado / Curso</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium" 
                                                placeholder="Ej. 10mo EGB"
                                                value={form.grade} 
                                                onChange={e => setForm({...form, grade: e.target.value})} 
                                            />
                                        </div>
                                    )}
                                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm uppercase tracking-wide py-4 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 mt-2">
                                        Crear Usuario
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 text-center animate-fadeIn">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-green-800 dark:text-green-300 mb-4">¡Usuario Generado!</h4>
                                    
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left mb-6 shadow-sm">
                                        <div className="grid gap-3">
                                            <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre:</span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{createdUser.fullName}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2">
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Código (User):</span>
                                                <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">{createdUser.encryptedCode}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Contraseña:</span>
                                                <span className="font-mono text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{createdUser.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => setCreatedUser(null)} 
                                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition flex items-center justify-center gap-1 mx-auto"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        Generar otro usuario
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'LIST' && (
                        <div className="space-y-3">
                            {userList.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay usuarios registrados.</p>
                            ) : (
                                userList.map((u) => (
                                    <div key={u.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                                                    u.role === UserRole.STUDENT ? 'bg-blue-600' :
                                                    u.role === UserRole.PARENT ? 'bg-purple-600' :
                                                    u.role === UserRole.TEACHER ? 'bg-cyan-600' :
                                                    u.role === UserRole.ADMIN ? 'bg-gray-800' : 'bg-pink-600'
                                                }`}>
                                                    {u.role}
                                                </span>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{u.fullName}</h4>
                                            </div>
                                            {u.grade && <p className="text-xs text-gray-500 dark:text-gray-400">Grado: {u.grade}</p>}
                                        </div>
                                        <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                            <div className="flex justify-between sm:justify-end gap-3 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Usuario:</span>
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{u.encryptedCode}</span>
                                            </div>
                                            <div className="flex justify-between sm:justify-end gap-3 text-sm">
                                                <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">Pass:</span>
                                                <span className="font-mono text-gray-800 dark:text-gray-200">{u.password}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Updated Auth Screen: Code & Password only
const AuthScreen = ({ onLogin }: { onLogin: (u: UserProfile) => void }) => {
  const [formData, setFormData] = useState({ code: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = loginUserByCredentials(formData.code, formData.password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas. Verifica tu código único y contraseña.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl mt-12 border border-gray-300 dark:border-gray-700 transition-colors duration-200">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-700 dark:bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-indigo-100 dark:border-indigo-900">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Acceso Seguro</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Ingresa con las credenciales anónimas proporcionadas por la institución.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Código Único de Identificación</label>
          <div className="relative rounded-md shadow-sm">
            <input 
              required 
              type="text" 
              placeholder="Ej. EST-2024-A"
              className="block w-full rounded-lg border-2 border-gray-600 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 p-3.5 focus:border-indigo-500 focus:ring-0 text-white placeholder-gray-400 font-bold tracking-wider sm:text-sm uppercase"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
          <div className="relative rounded-md shadow-sm">
            <input 
              required 
              type="password" 
              placeholder="••••••••"
              className="block w-full rounded-lg border-2 border-gray-600 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 p-3.5 focus:border-indigo-500 focus:ring-0 text-white placeholder-gray-400 font-bold sm:text-sm"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
        </div>

        {error && (
          <div className="text-sm font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3.5 rounded-lg font-bold transition shadow-lg text-base tracking-wide border border-indigo-900 dark:border-indigo-800">
          Ingresar al Sistema
        </button>
      </form>

      <div className="mt-8 bg-gray-100 dark:bg-gray-700/50 p-5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
        <p className="font-bold mb-2 text-gray-800 dark:text-gray-200 uppercase tracking-wide">Usuarios de Prueba (Demo):</p>
        <ul className="list-disc list-inside space-y-1 font-medium">
          <li>Estudiante: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">EST-2024-A</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Padre: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">FAM-2024-B</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Docente: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">DOC-2024-C</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Admin: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">ADM-MASTER</span> / <span className="font-mono text-gray-900 dark:text-white">admin</span></li>
          <li>DECE: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">STAFF-PSI</span> / <span className="font-mono text-gray-900 dark:text-white">staff</span></li>
        </ul>
      </div>
    </div>
  );
};

// Sub-component for individual notification card to handle reply state locally
const NotificationCard: React.FC<{ 
    note: any; 
    userCode: string; 
    onReplied: (updatedUser: UserProfile) => void 
}> = ({ note, userCode, onReplied }) => {
    const [replyText, setReplyText] = useState('');
    
    const handleReply = () => {
        if (!replyText.trim()) return;
        const updatedUser = replyToNotification(userCode, note.id, replyText);
        if (updatedUser) {
            onReplied(updatedUser);
        }
    };

    return (
        <div className="group bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${note.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-yellow-500'}`}></div>
            <div className="flex justify-between items-start mb-2 pl-2">
                <h4 className={`text-base ${note.read ? 'font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>{note.title}</h4>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">{new Date(note.date).toLocaleDateString()} {new Date(note.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 pl-2 leading-relaxed mb-3">{note.message}</p>
            
            {/* Action Area */}
            {note.type === 'REQUEST' && (
                <div className="pl-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {note.reply ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Respondiste el {new Date(note.replyDate).toLocaleDateString()}:</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{note.reply}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Se requiere tu respuesta:</p>
                            <textarea 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Escribe tu respuesta aquí..."
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button 
                                onClick={handleReply}
                                disabled={!replyText.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enviar Respuesta
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Componente para la vista del Usuario (Tabs)
const UserView: React.FC<{ 
    user: UserProfile; 
    viewState: 'HOME' | 'CHAT_SUCCESS'; 
    onCaseSubmitted: (c: ConflictCase) => void; 
    onReset: () => void 
}> = ({ user, viewState, onCaseSubmitted, onReset }) => {
    const [activeTab, setActiveTab] = useState<'CHAT' | 'NOTIFICATIONS'>('CHAT');
    // We need local state for the user to reflect updates (replies) immediately without full app reload
    const [localUser, setLocalUser] = useState<UserProfile>(user);

    useEffect(() => {
        setLocalUser(user);
    }, [user]);

    const handleUserUpdate = (updatedUser: UserProfile) => {
        setLocalUser(updatedUser);
    };
    
    // Count unread notifications (simple length check for demo)
    const notificationCount = localUser.notifications?.filter(n => !n.read).length || 0;

    if (viewState === 'CHAT_SUCCESS') {
         return (
          <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl mt-12 border-2 border-emerald-500 transition-colors duration-200">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Reporte Registrado</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
              El sistema ha encriptado tu reporte y activado el protocolo correspondiente. 
              El caso será analizado por las instancias apropiadas para su solución.
              <br/><br/>
              <strong>Por favor, revisa periódicamente tu "Buzón de Notificaciones" en la pestaña superior para dar seguimiento.</strong>
            </p>
            <button 
                onClick={() => {
                    onReset();
                    setActiveTab('NOTIFICATIONS');
                }} 
                className="text-indigo-700 dark:text-indigo-400 font-bold hover:underline hover:text-indigo-900 dark:hover:text-indigo-300 text-lg"
            >
                Ir a mis Notificaciones
            </button>
          </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Greeting */}
             <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Hola,</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Bienvenido a tu espacio seguro.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('CHAT')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2 ${
                        activeTab === 'CHAT'
                        ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Nuevo Reporte
                </button>
                <button
                    onClick={() => setActiveTab('NOTIFICATIONS')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2 ${
                        activeTab === 'NOTIFICATIONS'
                        ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Notificaciones
                    {notificationCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                            {notificationCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="transition-opacity duration-300">
                {activeTab === 'CHAT' && (
                    <div className="space-y-6">
                        {/* Identity Protection Banner */}
                        <div className="bg-white dark:bg-gray-800 border-l-8 border-indigo-600 shadow-md rounded-r-lg p-6 transition-colors duration-200">
                            <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                                <svg className="w-8 h-8 text-indigo-700 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tu Identidad está Protegida</h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Sesión iniciada como: <span className="font-mono font-bold bg-gray-900 dark:bg-black text-white px-3 py-1 rounded tracking-wider">{localUser.encryptedCode}</span></p>
                            </div>
                            </div>
                            <p className="text-base text-gray-700 dark:text-gray-300 font-medium ml-14 leading-relaxed">
                            Este chat es seguro. La información personal se almacena separada de tu reporte para garantizar el anonimato durante el proceso de gestión.
                            </p>
                        </div>

                        {/* Chat Interface */}
                        <ChatInterface user={localUser} onCaseSubmitted={onCaseSubmitted} />
                    </div>
                )}

                {activeTab === 'NOTIFICATIONS' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buzón de Mensajes</h3>
                            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 uppercase">Marcar todo como leído</button>
                        </div>
                        
                        <div className="space-y-4">
                        {localUser.notifications?.length > 0 ? (
                            localUser.notifications?.map((note) => (
                                <NotificationCard 
                                    key={note.id} 
                                    note={note} 
                                    userCode={localUser.encryptedCode}
                                    onReplied={handleUserUpdate}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Todo está tranquilo por aquí.</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">No tienes notificaciones pendientes.</p>
                            </div>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [systemUnlocked, setSystemUnlocked] = useState(false);
  const [currentSystemUser, setCurrentSystemUser] = useState<string>(''); // Tracks who unlocked the Gate
  const [showUserGenerator, setShowUserGenerator] = useState(false);
  const [showDemoAccessManager, setShowDemoAccessManager] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedCase, setSelectedCase] = useState<ConflictCase | null>(null);
  const [viewState, setViewState] = useState<'HOME' | 'CHAT_SUCCESS'>('HOME');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Refresh mechanism for dashboard
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const allCases = useMemo(() => getCases(), [refreshTrigger, viewState]);

  // Derived state to ensure CaseDetail gets the latest version of the object
  // when local storage is updated (triggered by onUpdate -> setRefreshTrigger)
  const activeCase = useMemo(() => {
    if (!selectedCase) return null;
    return allCases.find(c => c.id === selectedCase.id) || selectedCase;
  }, [selectedCase, allCases]);

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCase(null);
    setViewState('HOME');
  };

  const handleCaseSubmitted = (newCase: ConflictCase) => {
    setViewState('CHAT_SUCCESS');
  };

  // --- LOGIC GATE ---
  if (!systemUnlocked) {
      return <SystemGateScreen onUnlock={(username) => { 
          setSystemUnlocked(true); 
          setCurrentSystemUser(username);
      }} />;
  }

  // --- MAIN APP ---
  return (
    <>
      {/* Demo Admin Bar - Only visible when system unlocked */}
      <div className="bg-black text-white px-4 py-2 text-xs font-bold flex flex-wrap justify-between items-center z-50 relative gap-2 shadow-lg">
          <div className="flex items-center gap-3">
              <span className="text-yellow-500 tracking-wider">● MODO DEMOSTRACIÓN</span>
              <button 
                  onClick={() => {
                      setSystemUnlocked(false);
                      setCurrentSystemUser('');
                      setCurrentUser(null);
                      setViewState('HOME');
                  }} 
                  className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-300 px-3 py-1 rounded border border-gray-700 hover:border-red-800 transition flex items-center gap-1"
              >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Bloquear / Salir
              </button>
          </div>
          <div className="flex gap-2">
            {currentSystemUser === 'cuentame2026' && (
                <button 
                    onClick={() => setShowDemoAccessManager(true)} 
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition shadow-lg border border-orange-400 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    Administrar Demo
                </button>
            )}
            <button 
                onClick={() => setShowUserGenerator(true)} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md font-bold text-xs uppercase tracking-wider transition shadow-lg border border-indigo-400 flex items-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                Usuarios Demos
            </button>
          </div>
      </div>

      {showDemoAccessManager && <DemoAccessModal onClose={() => setShowDemoAccessManager(false)} />}
      {showUserGenerator && <UserGeneratorModal onClose={() => setShowUserGenerator(false)} />}

      {!currentUser ? (
        <Layout onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <div className="text-center mb-8 mt-4">
              <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                <span className="text-indigo-800 dark:text-indigo-400">CUÉNTAME</span>
              </h1>
              <p className="text-xl font-medium text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Plataforma de Gestión Integral de Conflictos Escolares
              </p>
          </div>
          <AuthScreen onLogin={setCurrentUser} />
        </Layout>
      ) : currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.PARENT || currentUser.role === UserRole.TEACHER ? (
        <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          <UserView 
              user={currentUser} 
              viewState={viewState} 
              onCaseSubmitted={handleCaseSubmitted}
              onReset={() => setViewState('HOME')}
          />
        </Layout>
      ) : (
        <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
          {activeCase ? (
            <CaseDetail 
              caseData={activeCase} 
              onBack={() => { setSelectedCase(null); setRefreshTrigger(p => p+1); }} 
              onUpdate={() => setRefreshTrigger(p => p+1)}
            />
          ) : (
            <Dashboard cases={allCases} onSelectCase={setSelectedCase} />
          )}
        </Layout>
      )}
    </>
  );
};

export default App;
