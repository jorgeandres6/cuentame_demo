-- Script para corregir usuarios en la Base de Datos

-- 1. Eliminar usuarios mal formateados
DELETE FROM ChatConversations WHERE encryptedUserCode NOT IN (SELECT UPPER(encryptedCode) FROM UserProfiles);
DELETE FROM ConflictCases WHERE encryptedUserCode NOT IN (SELECT UPPER(encryptedCode) FROM UserProfiles);

-- 2. Convertir todos los encryptedCode a mayúsculas
UPDATE UserProfiles SET encryptedCode = UPPER(encryptedCode);

-- 3. Verificar que tenemos los usuarios correctos
SELECT id, encryptedCode, password, role FROM UserProfiles;

-- 4. Si necesitas crear usuarios correctamente, usa esto:
-- Eliminar si existen
DELETE FROM UserProfiles WHERE UPPER(encryptedCode) IN ('EST-2026-A', 'AAA');

-- Crear estudiante 1
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_001', 'EST-2026-A', '123', 'STUDENT', GETUTCDATE(), GETUTCDATE());

-- Crear estudiante 2
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_002', 'EST-2026-B', '123', 'STUDENT', GETUTCDATE(), GETUTCDATE());

-- Crear padres
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_003', 'FAM-2026-A', '123', 'PARENT', GETUTCDATE(), GETUTCDATE());

-- Crear docente
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_004', 'DOC-2026-A', '123', 'TEACHER', GETUTCDATE(), GETUTCDATE());

-- Crear staff/psicólogo
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_005', 'STAFF-2026-PSI', 'staff', 'STAFF', GETUTCDATE(), GETUTCDATE());

-- Crear admin
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES ('usr_006', 'ADM-2026-MASTER', 'admin', 'ADMIN', GETUTCDATE(), GETUTCDATE());

-- Verificar resultados
SELECT id, encryptedCode, password, role, createdAt FROM UserProfiles ORDER BY createdAt;
