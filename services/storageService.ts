
import { UserProfile, ConflictCase, UserRole, UserNotification } from '../types';

// In-memory simulation of the two distinct repositories
// In a real architecture, these would be separate encrypted databases or tables with strict RLS.

const USERS_KEY = 'CUENTAME_USERS';
const CASES_KEY = 'CUENTAME_CASES';
const DEMO_ACCESS_KEY = 'CUENTAME_DEMO_ACCESS'; // New key for Gate Users
const DEMO_LOGS_KEY = 'CUENTAME_DEMO_LOGS'; // New key for Access Logs

// --- TYPES FOR DEMO GATE ACCESS ---
export interface DemoGateUser {
    id: string;
    username: string;
    password: string; // In real app, this should be hashed
    label: string;    // e.g., "Evaluador Ministerio", "Director Invitado"
    createdAt: string;
}

export interface GateLoginLog {
    id: string;
    username: string;
    timestamp: string;
    ip: string;
}

// Datos semilla para probar la aplicación inmediatamente
const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_001',
    fullName: 'Estudiante Demo',
    encryptedCode: 'EST-2024-A',
    password: '123',
    role: UserRole.STUDENT,
    phone: 'N/A',
    grade: '10',
    demographics: { address: 'Calle Ficticia 123' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_002',
    fullName: 'Padre Demo',
    encryptedCode: 'FAM-2024-B',
    password: '123',
    role: UserRole.PARENT,
    phone: '555-0000',
    demographics: { address: 'Avenida Siempre Viva' },
    psychographics: { 
        interests: [], 
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_003',
    fullName: 'Profesor Demo',
    encryptedCode: 'DOC-2024-C',
    password: '123',
    role: UserRole.TEACHER,
    phone: 'N/A',
    demographics: {},
    psychographics: {
        interests: [],
        personalityTraits: [],
        values: [],
        motivations: [],
        lifestyle: []
    },
    notifications: []
  },
  {
    id: 'usr_admin',
    fullName: 'Director General',
    encryptedCode: 'ADM-MASTER',
    password: 'admin',
    role: UserRole.ADMIN,
    phone: 'N/A',
    demographics: {},
    notifications: []
  },
  {
    id: 'usr_staff',
    fullName: 'Psicóloga Escolar',
    encryptedCode: 'STAFF-PSI',
    password: 'staff',
    role: UserRole.STAFF,
    phone: 'N/A',
    demographics: {},
    notifications: []
  }
];

// Helper to check and seed data if empty
const initializeData = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
};

// Initialize immediately upon import
initializeData();

// --- SYSTEM GATE LOGIC (Demo Access) ---

export const getSystemGateUsers = (): DemoGateUser[] => {
    const data = localStorage.getItem(DEMO_ACCESS_KEY);
    return data ? JSON.parse(data) : [];
};

export const registerSystemGateUser = (username: string, pass: string, label: string): DemoGateUser => {
    const users = getSystemGateUsers();
    const newUser: DemoGateUser = {
        id: Date.now().toString(),
        username,
        password: pass,
        label,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(DEMO_ACCESS_KEY, JSON.stringify(users));
    return newUser;
};

export const verifySystemGateCredentials = (user: string, pass: string): boolean => {
    // 1. Check Master Credentials
    if (user === 'cuentame2026' && pass === 'Cu3nt@m3') {
        return true;
    }
    // 2. Check Dynamic Credentials
    const gateUsers = getSystemGateUsers();
    return gateUsers.some(u => u.username === user && u.password === pass);
};

// --- AUDIT LOG LOGIC ---

export const getGateLoginLogs = (): GateLoginLog[] => {
    const data = localStorage.getItem(DEMO_LOGS_KEY);
    return data ? JSON.parse(data) : [];
};

export const recordGateLogin = async (username: string): Promise<void> => {
    let ip = 'IP Privada / Desconocida';
    try {
        // Simple call to a public IP echo service
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            ip = data.ip;
        }
    } catch (error) {
        console.warn("Could not fetch IP address for log", error);
    }

    const logs = getGateLoginLogs();
    const newLog: GateLoginLog = {
        id: Date.now().toString(),
        username,
        timestamp: new Date().toISOString(),
        ip
    };
    
    // Add to beginning of array
    logs.unshift(newLog);
    
    // Optional: Limit log size to last 50 entries to prevent overflow in localstorage
    if (logs.length > 50) logs.length = 50;

    localStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
};

// --- Repository 1: User Profiles (Restricted) ---

// Helper to simulate encryption/hashing
export const generateEncryptedCode = (userId: string): string => {
  return `ENC-${userId.substring(0, 4)}-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

export const saveUserProfile = (profile: UserProfile): void => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === profile.id);
  if (index >= 0) {
    users[index] = profile;
  } else {
    users.push(profile);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// NEW: Helper to create a new user dynamically from the UI
export const registerNewUser = (fullName: string, role: UserRole, password: string, grade?: string): UserProfile => {
    const prefixMap = {
        [UserRole.STUDENT]: 'EST',
        [UserRole.PARENT]: 'FAM',
        [UserRole.TEACHER]: 'DOC',
        [UserRole.STAFF]: 'STAFF',
        [UserRole.ADMIN]: 'ADM'
    };
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${prefixMap[role]}-2026-${randomSuffix}`;
    
    const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        fullName,
        encryptedCode: code,
        password,
        role,
        grade, // Optional
        phone: 'N/A',
        demographics: {},
        notifications: [],
        psychographics: {
            interests: [], 
            personalityTraits: [],
            values: [],
            motivations: [],
            lifestyle: []
        }
    };
    
    saveUserProfile(newUser);
    return newUser;
};

export const getUsers = (): UserProfile[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

// Only accessible by ADMIN or System Process during Report Generation
export const getUserProfileByCode = (encryptedCode: string): UserProfile | undefined => {
  const users = getUsers();
  return users.find(u => u.encryptedCode === encryptedCode);
};

// Modified Login: Uses Code and Password instead of Email
export const loginUserByCredentials = (code: string, password: string): UserProfile | undefined => {
  const users = getUsers();
  // Case insensitive check for code
  return users.find(u => u.encryptedCode.toUpperCase() === code.toUpperCase() && u.password === password);
};

// Helper to Add Notification to User
export const addNotificationToUser = (
    encryptedCode: string, 
    title: string, 
    message: string,
    type: 'INFO' | 'REQUEST' = 'INFO',
    relatedCaseId?: string
): void => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.encryptedCode === encryptedCode);
    
    if (userIndex >= 0) {
        const newNotification: UserNotification = {
            id: Date.now().toString(),
            title,
            message,
            date: new Date().toISOString(),
            read: false,
            type,
            relatedCaseId
        };
        
        // Ensure notifications array exists
        if (!users[userIndex].notifications) {
            users[userIndex].notifications = [];
        }
        
        users[userIndex].notifications.unshift(newNotification); // Add to top
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

// Helper for User to Reply to a Notification
export const replyToNotification = (encryptedCode: string, notificationId: string, replyText: string): UserProfile | null => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.encryptedCode === encryptedCode);
    
    if (userIndex >= 0) {
        const user = users[userIndex];
        const notifIndex = user.notifications.findIndex(n => n.id === notificationId);
        
        if (notifIndex >= 0) {
            user.notifications[notifIndex].reply = replyText;
            user.notifications[notifIndex].replyDate = new Date().toISOString();
            user.notifications[notifIndex].read = true;
            
            users[userIndex] = user;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return user;
        }
    }
    return null;
};

// --- Repository 2: Casos (Broad Access - Anonymous) ---

export const saveCase = (conflictCase: ConflictCase): void => {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === conflictCase.id);
  if (index >= 0) {
    cases[index] = conflictCase;
  } else {
    cases.push(conflictCase);
  }
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
};

export const getCases = (): ConflictCase[] => {
  const data = localStorage.getItem(CASES_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCaseByCode = (code: string): ConflictCase | undefined => {
  return getCases().find(c => c.encryptedUserCode === code);
};
