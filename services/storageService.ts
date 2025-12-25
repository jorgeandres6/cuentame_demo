
import { UserProfile, ConflictCase, UserRole, UserNotification } from '../types';

// In-memory simulation of the two distinct repositories
const USERS_KEY = 'CUENTAME_USERS';
const CASES_KEY = 'CUENTAME_CASES';
const DEMO_ACCESS_KEY = 'CUENTAME_DEMO_ACCESS'; 
const DEMO_LOGS_KEY = 'CUENTAME_DEMO_LOGS';

export interface DemoGateUser {
    id: string;
    username: string;
    password: string; 
    label: string;    
    createdAt: string;
}

export interface GateLoginLog {
    id: string;
    username: string;
    timestamp: string;
    ip: string;
}

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

const initializeData = () => {
  const users = localStorage.getItem(USERS_KEY);
  if (!users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
};

initializeData();

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
    if (user === 'cuentame2026' && pass === 'Cu3nt@m3') {
        return true;
    }
    const gateUsers = getSystemGateUsers();
    return gateUsers.some(u => u.username === user && u.password === pass);
};

export const getGateLoginLogs = (): GateLoginLog[] => {
    const data = localStorage.getItem(DEMO_LOGS_KEY);
    return data ? JSON.parse(data) : [];
};

export const recordGateLogin = async (username: string): Promise<void> => {
    let ip = 'IP Privada / Desconocida';
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            ip = data.ip;
        }
    } catch (error) {}

    const logs = getGateLoginLogs();
    const newLog: GateLoginLog = {
        id: Date.now().toString(),
        username,
        timestamp: new Date().toISOString(),
        ip
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.length = 50;
    localStorage.setItem(DEMO_LOGS_KEY, JSON.stringify(logs));
};

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
        grade,
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

export const getUserProfileByCode = (encryptedCode: string): UserProfile | undefined => {
  const users = getUsers();
  return users.find(u => u.encryptedCode === encryptedCode);
};

export const loginUserByCredentials = (code: string, password: string): UserProfile | undefined => {
  const users = getUsers();
  return users.find(u => u.encryptedCode.toUpperCase() === code.toUpperCase() && u.password === password);
};

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
        if (!users[userIndex].notifications) users[userIndex].notifications = [];
        users[userIndex].notifications.unshift(newNotification);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
};

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

export const getCasesByUserCode = (code: string): ConflictCase[] => {
    return getCases().filter(c => c.encryptedUserCode === code);
};
