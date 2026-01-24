-- ============================================================
-- MIGRACIÓN: Agregar campos psicográficos y sociográficos a UserProfiles
-- Fecha: 2026-01-23
-- Propósito: Agregar perfiles psicográfico y sociográfico para mejor contexto
--            de casos por parte del staff y el bot
-- ============================================================

-- 1. Agregar columna psychographics si no existe
IF NOT EXISTS (
  SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'UserProfiles' AND COLUMN_NAME = 'psychographics'
)
BEGIN
  ALTER TABLE UserProfiles ADD psychographics NVARCHAR(MAX);
  PRINT '✅ Columna psychographics agregada';
END
ELSE
BEGIN
  PRINT '⚠️  Columna psychographics ya existe';
END
GO

-- 2. Agregar columna sociographics si no existe
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

-- 3. Actualizar usuarios existentes con datos PSICOGRÁFICOS por defecto
UPDATE UserProfiles
SET psychographics = CASE 
  WHEN role = 'STUDENT' THEN JSON_QUERY('{
    "interests": ["Deportes", "Música"],
    "values": ["Honestidad", "Amistad"],
    "motivations": ["Aprobación social", "Aprendizaje"],
    "lifestyle": ["Estudiante activo"],
    "personalityTraits": ["Introvertido", "Sensible"]
  }')
  WHEN role = 'PARENT' THEN JSON_QUERY('{
    "interests": ["Familia", "Educación"],
    "values": ["Familia", "Seguridad"],
    "motivations": ["Bienestar de hijos", "Educación"],
    "lifestyle": ["Padre/Madre responsable"],
    "personalityTraits": ["Protector", "Responsable"]
  }')
  WHEN role = 'TEACHER' THEN JSON_QUERY('{
    "interests": ["Educación", "Desarrollo personal"],
    "values": ["Enseñanza", "Ética"],
    "motivations": ["Formar personas", "Cambio social"],
    "lifestyle": ["Docente comprometido"],
    "personalityTraits": ["Empático", "Dedicado"]
  }')
  ELSE '{}'
END
WHERE psychographics IS NULL OR psychographics = '';

PRINT '✅ Perfiles psicográficos inicializados';
GO

-- 4. Actualizar usuarios existentes con datos SOCIOGRÁFICOS por defecto
UPDATE UserProfiles
SET sociographics = CASE 
  WHEN role = 'STUDENT' THEN JSON_QUERY('{
    "educationLevel": "Secundaria",
    "schoolName": "Unidad Educativa",
    "schoolType": "Público",
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

-- 5. Verificar resultados
SELECT 
  encryptedCode,
  role,
  CASE 
    WHEN LEN(ISNULL(psychographics, '')) > 0 THEN '✅ Con datos'
    ELSE '⚠️  Sin datos'
  END as Estado_Psychographics,
  CASE 
    WHEN LEN(ISNULL(sociographics, '')) > 0 THEN '✅ Con datos'
    ELSE '⚠️  Sin datos'
  END as Estado_Sociographics
FROM UserProfiles;

PRINT '📊 Migración completada - Verifica los resultados arriba';
GO
PSICOGRÁFICOS incluyen:
-- - interests: Hobbies, gustos, actividades preferidas
-- - values: Qué valoran (justicia, lealtad, honestidad)
-- - motivations: Metas, qué los mueve, aspiraciones
-- - lifestyle: Rutinas, entorno social, hábitos
-- - personalityTraits: Introvertido, ansioso, líder, resiliente
--
-- Los campos SOCIOGRÁFICOS
-- ============================================================
-- NOTAS PARA EL STAFF:
-- 
-- Los campos sociográficos incluyen:
-- - educationLevel: Nivel educativo
-- - schoolName: Nombre del colegio o institución educativa
-- - schoolType: Tipo de colegio (Público, Privado, Fiscomisional)
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
