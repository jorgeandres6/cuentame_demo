// Este archivo contiene datos de prueba iniciales para desarrollo
// Se ejecuta en el servidor para crear usuarios demo en Azure SQL

import { UserRole } from './types.js';

export const INITIAL_DEMO_USERS = [
  {
    id: 'usr_001',
    fullName: 'Estudiante Demo',
    encryptedCode: 'EST-2026-A',
    password: '123',
    role: UserRole.STUDENT,
    phone: 'N/A',
    grade: '10',
    demographics: { address: 'Calle Ficticia 123' },
    psychographics: { 
      interests: ['Deportes', 'Música'], 
      personalityTraits: ['Introvertido', 'Sensible'],
      values: ['Honestidad', 'Amistad'],
      motivations: ['Aprobación', 'Aprendizaje'],
      lifestyle: ['Estudiante']
    },
    notifications: []
  },
  {
    id: 'usr_002',
    fullName: 'Padre Demo',
    encryptedCode: 'FAM-2026-B',
    password: '123',
    role: UserRole.PARENT,
    phone: '555-0000',
    demographics: { address: 'Avenida Siempre Viva' },
    psychographics: { 
      interests: ['Familia', 'Educación'], 
      personalityTraits: ['Protector', 'Responsable'],
      values: ['Familia', 'Seguridad'],
      motivations: ['Bienestar hijo', 'Educación'],
      lifestyle: ['Padre/Madre']
    },
    notifications: []
  },
  {
    id: 'usr_003',
    fullName: 'Profesor Demo',
    encryptedCode: 'DOC-2026-C',
    password: '123',
    role: UserRole.TEACHER,
    phone: 'N/A',
    demographics: {},
    psychographics: {
      interests: ['Educación', 'Desarrollo'],
      personalityTraits: ['Empático', 'Dedicado'],
      values: ['Enseñanza', 'Ética'],
      motivations: ['Formar personas', 'Cambio social'],
      lifestyle: ['Docente']
    },
    notifications: []
  },
  {
    id: 'usr_admin',
    fullName: 'Director General',
    encryptedCode: 'ADM-2026-MASTER',
    password: 'admin',
    role: UserRole.ADMIN,
    phone: 'N/A',
    demographics: {},
    notifications: []
  },
  {
    id: 'usr_staff',
    fullName: 'Psicóloga Escolar',
    encryptedCode: 'STAFF-2026-PSI',
    password: 'staff',
    role: UserRole.STAFF,
    phone: 'N/A',
    demographics: {},
    notifications: []
  }
];

export const INITIAL_DEMO_CASES = [
  {
    id: 'case_001',
    encryptedUserCode: 'EST-2026-A',
    reporterRole: 'STUDENT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'OPEN',
    typology: 'Conflicto leve entre pares',
    riskLevel: 'MEDIUM',
    summary: 'Conflicto entre compañeros en clase',
    recommendations: [
      'Mediación entre compañeros',
      'Seguimiento en próximas semanas',
      'Comunicación con familia'
    ],
    assignedProtocol: 'PROTOCOLO-01',
    assignedTo: 'Psicóloga Escolar',
    messages: [],
    interventions: [],
    evidence: []
  }
];
