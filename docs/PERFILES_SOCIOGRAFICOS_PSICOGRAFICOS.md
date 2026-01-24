# 📊 Perfiles Sociográficos y Psicográficos - Guía de Uso

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

---

## 🔧 Cómo Actualizar los Perfiles

### 1️⃣ **En Azure SQL Database**

Ejecuta en el Query Editor:

```sql
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

### 2️⃣ **Al Crear Nuevos Usuarios (seedDatabase.js)**

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
