# 📊 Perfiles Sociográficos y Psicográficos - Guía de Uso

## ✅ Estado Actual de la Base de Datos

**Los campos ya están creados en la tabla `UserProfiles`:**
- ✅ `psychographics` (NVARCHAR(MAX)) - Almacena datos JSON del perfil psicográfico
- ✅ `sociographics` (NVARCHAR(MAX)) - Almacena datos JSON del perfil sociográfico

**No necesitas:**
- ❌ Crear la tabla UserProfiles (ya existe)
- ❌ Agregar estas columnas manualmente (ya están)
- ❌ Ejecutar ALTER TABLE (el servidor lo hace automáticamente al iniciar)

**Sí necesitas:**
- ✅ Actualizar los datos JSON de usuarios existentes
- ✅ Ejecutar el script de migración si quieres valores por defecto
- ✅ Usar el script `seedDatabase.js` para insertar nuevos usuarios con perfiles completos

---

## 🎯 Propósito

Los campos de perfil **sociográfico** y **psicográfico** permiten al staff y al bot AI tener un contexto más completo del usuario, facilitando:

- ✅ Clasificación más precisa de casos
- ✅ Recomendaciones de intervención personalizadas
- ✅ Análisis de factores de riesgo contextual
- ✅ Mejor comprensión del entorno del estudiante

---

## 📋 Perfil Psicográfico

**Almacenado en:** `UserProfile.psychographics`

**Tipo:** JSON con la siguiente estructura:

```typescript
interface PsychographicProfile {
  interests: string[];       // Hobbies, gustos, actividades preferidas
  values: string[];          // Qué valoran (justicia, lealtad, honestidad)
  motivations: string[];     // Metas, qué los mueve, aspiraciones
  lifestyle: string[];       // Rutinas, entorno social, hábitos
  personalityTraits: string[]; // Introvertido, ansioso, líder, resiliente
}
```

**Ejemplo:**
```json
{
  "interests": ["Deportes", "Música", "Videojuegos"],
  "values": ["Honestidad", "Amistad", "Justicia"],
  "motivations": ["Aprobación social", "Aprendizaje", "Autonomía"],
  "lifestyle": ["Estudiante activo", "Vida social limitada"],
  "personalityTraits": ["Introvertido", "Sensible", "Creativo"]
}
```

---

## 🏘️ Perfil Sociográfico

**Almacenado en:** `UserProfile.sociographics`

**Tipo:** JSON con la siguiente estructura:

```typescript
interface SociographicProfile {
  educationLevel?: string;      // Primaria, Secundaria, Superior
  schoolName?: string;          // Nombre del colegio o institución educativa
  schoolType?: string;          // Público, Privado, Fiscomisional
  familyStructure?: string;     // Nuclear, Monoparental, Extendida
  socioeconomicStatus?: string; // Bajo, Medio, Alto
  geographicLocation?: string;  // Urbano, Rural
  culturalBackground?: string;  // Antecedentes culturales o étnicos
  religion?: string;            // Afiliación religiosa
  occupationStatus?: string;    // Estudiante, Empleado, Desempleado
  householdSize?: number;       // Número de personas en el hogar
  socialSupport?: string;       // Fuerte, Moderado, Débil
  livingConditions?: string;    // Precarias, Adecuadas, Buenas
}
```

**Ejemplo:**
```json
{
  "educationLevel": "Secundaria",
  "schoolName": "Colegio Nacional Montúfar",
  "schoolType": "Público",
  "familyStructure": "Monoparental",
  "socioeconomicStatus": "Bajo",
  "geographicLocation": "Urbano",
  "culturalBackground": "Mestizo",
  "occupationStatus": "Estudiante",
  "householdSize": 3,
  "socialSupport": "Débil",
  "livingConditions": "Adecuadas"
}
```

Luego ejecuta: `npm run seed`

---

## 🚀 Inicio Rápido - Paso a Paso

### Para Agregar Perfiles Psicográficos a la Base de Datos:

**Paso 1: Conectar a Azure Portal**
1. Ve a https://portal.azure.com
2. Busca tu base de datos `cuentame-app`
3. Abre **Query Editor**

**Paso 2: Verificar que los Campos Existen**
```sql
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'UserProfiles' 
  AND COLUMN_NAME IN ('psychographics', 'sociographics');
```
✅ Debe mostrar ambos campos

**Paso 3: Ver Usuarios Actuales**
```sql
SELECT encryptedCode, 
       CASE WHEN psychographics IS NOT NULL THEN '✅ Con perfil' 
            ELSE '⚠️ Sin perfil' END as Estado_Psico,
       CASE WHEN sociographics IS NOT NULL THEN '✅ Con perfil' 
            ELSE '⚠️ Sin perfil' END as Estado_Socio
FROM UserProfiles;
```

**Paso 4: Actualizar Perfiles**

Opción A - Manual (un usuario):
```sql
UPDATE UserProfiles
SET 
  psychographics = '{"interests": ["Deportes"], "values": ["Honestidad"], "motivations": ["Aprendizaje"], "lifestyle": ["Estudiante"], "personalityTraits": ["Introvertido"]}',
  sociographics = '{"educationLevel": "Secundaria", "schoolName": "Colegio Nacional", "schoolType": "Público", "familyStructure": "Nuclear", "socioeconomicStatus": "Medio", "socialSupport": "Moderado"}'
WHERE encryptedCode = 'EST-2026-A';
```

Opción B - Automática (todos los usuarios):
```sql
-- Ejecutar el archivo completo: MIGRATION_ADD_SOCIOGRAPHICS.sql
```

**Paso 5: Verificar Resultados**
```sql
SELECT encryptedCode, psychographics, sociographics 
FROM UserProfiles 
WHERE encryptedCode = 'EST-2026-A';
```

---

## 🔧 Cómo Actualizar los Perfiles

> **Nota Importante:** Los campos `psychographics` y `sociographics` **ya existen** en la tabla `UserProfiles` desde la creación inicial. No necesitas crear la tabla ni agregar columnas manualmente.

### 1️⃣ **Verificar que los Campos Existen**

```sql
-- Verificar estructura de la tabla
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'UserProfiles' 
  AND COLUMN_NAME IN ('psychographics', 'sociographics');

-- Debe mostrar:
-- psychographics | NVARCHAR
-- sociographics  | NVARCHAR
```

### 2️⃣ **Actualizar Perfiles de Usuarios Existentes**

Ejecuta en el Query Editor de Azure Portal:

#### **Opción A: Actualizar UN usuario específico**

```sql
-- Actualizar perfil psicográfico de un estudiante
UPDATE UserProfiles
SET psychographics = '{
  "interests": ["Fútbol", "Arte"],
  "values": ["Familia", "Respeto"],
  "motivations": ["Superación personal"],
  "lifestyle": ["Estudiante comprometido"],
  "personalityTraits": ["Resiliente", "Empático"]
}'
WHERE encryptedCode = 'EST-2026-A';

-- Verificar
SELECT encryptedCode, psychographics 
FROM UserProfiles 
WHERE encryptedCode = 'EST-2026-A';
```

#### **Opción B: Script de Migración Automática (Valores por Defecto)**

Si ya ejecutaste `npm run seed`, los usuarios demo ya tienen perfiles. Si tienes usuarios SIN perfiles, usa:

```sql
-- Script de migración automática
-- Ver archivo: MIGRATION_ADD_SOCIOGRAPHICS.sql
```

Ejecuta el archivo [MIGRATION_ADD_SOCIOGRAPHICS.sql](../MIGRATION_ADD_SOCIOGRAPHICS.sql) completo en Azure Portal.

---
-- Actualizar perfil sociográfico de un usuario específico
UPDATE UserProfiles
SET sociographics = '{
  "educationLevel": "Secundaria",
  "schoolName": "Colegio Nacional Montúfar",
  "schoolType": "Público",
  "familyStructure": "Monoparental",
  "socioeconomicStatus": "Bajo",
  "geographicLocation": "Urbano",
  "householdSize": 3,
  "socialSupport": "Débil",
  "livingConditions": "Adecuadas"
}'
WHERE encryptedCode = 'EST-2026-A';

-- Actualizar perfil psicográfico
UPDATE UserProfiles
SET psychographics = '{
  "interests": ["Fútbol", "Arte"],
  "values": ["Familia", "Respeto"],
  "motivations": ["Superación personal"],
  "lifestyle": ["Estudiante comprometido"],
  "personalityTraits": ["Resiliente", "Empático"]
}'
WHERE encryptedCode = 'EST-2026-A';
```

---

### 3️⃣ **Al Crear Nuevos Usuarios (seedDatabase.js)**

Si quieres agregar usuarios con perfiles completos desde el código:

```javascript
const newUser = {
  id: 'usr_004',
  fullName: 'Nuevo Estudiante',
  encryptedCode: 'EST-2026-D',
  password: '123',
  role: 'student',
  demographics: JSON.stringify({ 
    address: 'Calle Principal 456' 
  }),
  psychographics: JSON.stringify({
    interests: ['Lectura', 'Ciencias'],
    values: ['Conocimiento', 'Verdad'],
    motivations: ['Excelencia académica'],
    lifestyle: ['Estudioso'],
    personalityTraits: ['Analítico', 'Reservado']
  }),
  sociographics: JSON.stringify({
    educationLevel: 'Secundaria',
    schoolName: 'Unidad Educativa Particular San José',
    schoolType: 'Privado',
    familyStructure: 'Nuclear',
    socioeconomicStatus: 'Medio-Alto',
    geographicLocation: 'Urbano',
    householdSize: 5,
    socialSupport: 'Fuerte',
    livingConditions: 'Buenas'
  })
};
```

---

## 🤖 Cómo el Bot AI Usa Esta Información

El bot puede analizar estos perfiles para:

1. **Adaptar el Tono**: Más empático con usuarios de alta sensibilidad
2. **Identificar Factores de Riesgo**: Bajo apoyo social + alta vulnerabilidad
3. **Personalizar Recomendaciones**: Sugerir recursos según contexto socioeconómico
4. **Detectar Patrones**: Correlaciones entre perfil y tipos de conflicto

**Ejemplo de prompt interno:**

```
Usuario: EST-2026-A
Psicográfico: Introvertido, Sensible, Valora "Amistad"
Sociográfico: Familia monoparental, Apoyo social débil
Caso Reportado: Acoso escolar

→ Bot detecta: Alta vulnerabilidad
→ Recomendación: Intervención DECE urgente + Acompañamiento psicológico
```

---

## 📊 Consultas Útiles para el Staff

### Ver Todos los Perfiles

```sql
SELECT 
  encryptedCode,
  fullName,
  role,
  JSON_VALUE(sociographics, '$.socioeconomicStatus') as Nivel_Socioeconomico,
  JSON_VALUE(sociographics, '$.socialSupport') as Apoyo_Social,
  JSON_VALUE(psychographics, '$.personalityTraits') as Rasgos
FROM UserProfiles
WHERE role = 'STUDENT';
```

### Identificar Estudiantes en Riesgo

```sql
SELECT 
  encryptedCode,
  fullName,
  JSON_VALUE(sociographics, '$.socialSupport') as Apoyo_Social,
  JSON_VALUE(sociographics, '$.livingConditions') as Condiciones_Vivienda
FROM UserProfiles
WHERE role = 'STUDENT'
  AND (
    JSON_VALUE(sociographics, '$.socialSupport') = 'Débil'
    OR JSON_VALUE(sociographics, '$.livingConditions') = 'Precarias'
  );
```

---

## ⚠️ Consideraciones de Privacidad

1. ✅ **Solo el staff autorizado** debe tener acceso a estos campos
2. ✅ Los campos son **opcionales** y deben actualizarse con consentimiento
3. ✅ **No mostrar** información sociográfica en interfaces públicas
4. ✅ Usar datos agregados para análisis estadísticos

---

## 🚀 Migración de Usuarios Existentes

Para actualizar usuarios existentes con valores por defecto:

```bash
# En Azure Portal → Query Editor
# Ejecutar: MIGRATION_ADD_SOCIOGRAPHICS.sql
```

Este script:
- ✅ Agrega la columna `sociographics` si no existe
- ✅ Inicializa perfiles con valores por defecto según el rol
- ✅ Muestra un reporte de usuarios actualizados

---

## 📚 Referencias

- **MINEDUC Ecuador**: Protocolos de Actuación en Casos de Violencia
- **LOEI**: Ley Orgánica de Educación Intercultural
- **Reglamento DECE**: Departamento de Consejería Estudiantil

---

## 🆘 Soporte

Para preguntas sobre el uso de perfiles:
1. Revisa [DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md)
2. Consulta al administrador del sistema
3. Contacta soporte técnico
