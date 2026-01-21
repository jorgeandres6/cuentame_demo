#!/usr/bin/env node
/**
 * Script para inicializar datos de prueba en Azure SQL
 * Uso: node seedDatabase.js
 */

import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const sqlConfig = {
  server: process.env.AZURE_SQL_SERVER || 'localhost',
  database: process.env.AZURE_SQL_DATABASE || 'cuentame_db',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectTimeout: 30000
  }
};

const DEMO_USERS = [
  {
    id: 'usr_001',
    fullName: 'Estudiante Demo',
    encryptedCode: 'EST-2026-A',
    password: '123',
    role: 'student',
    phone: 'N/A',
    grade: '10',
    demographics: JSON.stringify({ address: 'Calle Ficticia 123' }),
    psychographics: JSON.stringify({ 
      interests: ['Deportes', 'Música'], 
      personalityTraits: ['Introvertido', 'Sensible'],
      values: ['Honestidad', 'Amistad'],
      motivations: ['Aprobación', 'Aprendizaje'],
      lifestyle: ['Estudiante']
    })
  },
  {
    id: 'usr_002',
    fullName: 'Padre Demo',
    encryptedCode: 'FAM-2026-B',
    password: '123',
    role: 'parent',
    phone: '555-0000',
    grade: null,
    demographics: JSON.stringify({ address: 'Avenida Siempre Viva' }),
    psychographics: JSON.stringify({ 
      interests: ['Familia', 'Educación'], 
      personalityTraits: ['Protector', 'Responsable'],
      values: ['Familia', 'Seguridad'],
      motivations: ['Bienestar hijo', 'Educación'],
      lifestyle: ['Padre/Madre']
    })
  },
  {
    id: 'usr_003',
    fullName: 'Profesor Demo',
    encryptedCode: 'DOC-2026-C',
    password: '123',
    role: 'teacher',
    phone: 'N/A',
    grade: null,
    demographics: JSON.stringify({}),
    psychographics: JSON.stringify({
      interests: ['Educación', 'Desarrollo'],
      personalityTraits: ['Empático', 'Dedicado'],
      values: ['Enseñanza', 'Ética'],
      motivations: ['Formar personas', 'Cambio social'],
      lifestyle: ['Docente']
    })
  }
];

async function seedDatabase() {
  let pool;
  try {
    console.log('🔌 Conectando a Azure SQL Database...');
    pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();
    console.log('✅ Conectado exitosamente');

    // Crear tablas
    console.log('📋 Creando tablas...');
    const request = pool.request();
    
    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserProfiles')
      CREATE TABLE UserProfiles (
        id NVARCHAR(50) PRIMARY KEY,
        fullName NVARCHAR(255) NOT NULL,
        encryptedCode NVARCHAR(50) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL,
        phone NVARCHAR(20),
        grade NVARCHAR(10),
        email NVARCHAR(255),
        demographics NVARCHAR(MAX),
        psychographics NVARCHAR(MAX),
        notifications NVARCHAR(MAX),
        createdAt DATETIME DEFAULT GETUTCDATE(),
        updatedAt DATETIME DEFAULT GETUTCDATE()
      );
    `);

    await request.query(`
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConflictCases')
      CREATE TABLE ConflictCases (
        id NVARCHAR(50) PRIMARY KEY,
        encryptedUserCode NVARCHAR(50) NOT NULL,
        reporterRole NVARCHAR(20) NOT NULL,
        createdAt DATETIME DEFAULT GETUTCDATE(),
        updatedAt DATETIME DEFAULT GETUTCDATE(),
        status NVARCHAR(50) NOT NULL,
        typology NVARCHAR(255) NOT NULL,
        riskLevel NVARCHAR(20) NOT NULL,
        summary NVARCHAR(MAX),
        recommendations NVARCHAR(MAX),
        assignedProtocol NVARCHAR(100),
        assignedTo NVARCHAR(255),
        messages NVARCHAR(MAX),
        interventions NVARCHAR(MAX),
        evidence NVARCHAR(MAX)
      );
    `);

    console.log('✅ Tablas creadas o ya existen');

    // Insertar usuarios demo
    console.log('👥 Insertando usuarios de prueba...');
    for (const user of DEMO_USERS) {
      const req = pool.request();
      try {
        await req
          .input('id', sql.NVarChar, user.id)
          .input('fullName', sql.NVarChar, user.fullName)
          .input('encryptedCode', sql.NVarChar, user.encryptedCode)
          .input('password', sql.NVarChar, user.password)
          .input('role', sql.NVarChar, user.role)
          .input('phone', sql.NVarChar, user.phone)
          .input('grade', sql.NVarChar, user.grade)
          .input('demographics', sql.NVarChar, user.demographics)
          .input('psychographics', sql.NVarChar, user.psychographics)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM UserProfiles WHERE id = @id)
            BEGIN
              INSERT INTO UserProfiles (id, fullName, encryptedCode, password, role, phone, grade, demographics, psychographics, notifications)
              VALUES (@id, @fullName, @encryptedCode, @password, @role, @phone, @grade, @demographics, @psychographics, '[]')
            END
          `);
        console.log(`  ✅ Usuario ${user.encryptedCode} insertado`);
      } catch (err) {
        console.log(`  ⚠️  Usuario ${user.encryptedCode} ya existe`);
      }
    }

    console.log('✅ Base de datos inicializada correctamente');
    console.log('\n📍 Credenciales de prueba:');
    DEMO_USERS.forEach(u => {
      console.log(`  - ${u.encryptedCode} / ${u.password} (${u.role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

seedDatabase();
