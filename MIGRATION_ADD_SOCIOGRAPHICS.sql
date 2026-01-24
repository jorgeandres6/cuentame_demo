-- ============================================================
-- MIGRACIÓN: Agregar campos sociográficos a UserProfiles
-- Fecha: 2026-01-23
-- Propósito: Agregar perfil sociográfico para mejor contexto
--            de casos por parte del staff y el bot
-- ============================================================

-- 1. Agregar columna sociographics si no existe
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'UserProfiles' AND COLUMN_NAME = 'sociographics'
)
BEGIN
  ALTER TABLE UserProfiles ADD sociographics NVARCHAR(MAX);
  PRINT '✅ Columna sociographics agregada';
END
ELSE
BEGIN
  PRINT '⚠️  Columna sociographics ya existe';
END
GO

-- 2. Actualizar usuarios existentes con datos sociográficos por defecto
UPDATE UserProfiles
SET sociographics = CASE 
  WHEN role = 'STUDENT' THEN JSON_QUERY('{
    "educationLevel": "Secundaria",
    "familyStructure": "Nuclear",
    "socioeconomicStatus": "Medio",
    "geographicLocation": "Urbano",
    "occupationStatus": "Estudiante",
    "householdSize": 4,
    "socialSupport": "Moderado",
    "livingConditions": "Adecuadas"
  }')
  WHEN role = 'PARENT' THEN JSON_QUERY('{
    "educationLevel": "Superior",
    "familyStructure": "Nuclear",
    "socioeconomicStatus": "Medio",
    "geographicLocation": "Urbano",
    "occupationStatus": "Empleado",
    "householdSize": 4,
    "socialSupport": "Fuerte",
    "livingConditions": "Buenas"
  }')
  WHEN role = 'TEACHER' THEN JSON_QUERY('{
    "educationLevel": "Superior - Maestría",
    "socioeconomicStatus": "Medio",
    "geographicLocation": "Urbano",
    "occupationStatus": "Docente",
    "householdSize": 3,
    "socialSupport": "Fuerte",
    "livingConditions": "Buenas"
  }')
  ELSE '{}'
END
WHERE sociographics IS NULL OR sociographics = '';

PRINT '✅ Perfiles sociográficos inicializados';
GO

-- 3. Verificar resultados
SELECT 
  encryptedCode,
  role,
  CASE 
    WHEN LEN(ISNULL(sociographics, '')) > 0 THEN '✅ Con datos'
    ELSE '⚠️  Sin datos'
  END as Estado_Sociographics
FROM UserProfiles;

PRINT '📊 Migración completada - Verifica los resultados arriba';
GO

-- ============================================================
-- NOTAS PARA EL STAFF:
-- 
-- Los campos sociográficos incluyen:
-- - educationLevel: Nivel educativo
-- - familyStructure: Estructura familiar
-- - socioeconomicStatus: Nivel socioeconómico
-- - geographicLocation: Ubicación geográfica
-- - culturalBackground: Antecedentes culturales
-- - religion: Afiliación religiosa
-- - occupationStatus: Estado ocupacional
-- - householdSize: Tamaño del hogar
-- - socialSupport: Redes de apoyo social
-- - livingConditions: Condiciones de vivienda
--
-- Estos datos complementan el perfil psicográfico y permiten
-- una mejor comprensión del contexto del usuario para:
-- - Clasificación más precisa de casos
-- - Recomendaciones de intervención personalizadas
-- - Análisis de factores de riesgo contextual
-- ============================================================
