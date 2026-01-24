# 🔧 SOLUCIÓN: No Puedo Ingresar a la Plataforma

## ⚠️ El Problema

Creaste usuarios en la BD pero no puedes hacer login. Esto ocurre porque:

**El backend espera:** `EST-2026-A` (mayúsculas)  
**Tu BD tiene:** `AAA` u otro formato

---

## ✅ Solución Paso a Paso

### Opción 1: Usar el Script SQL (Recomendado - 2 minutos)

1. **Abre Azure Portal** → Tu BD SQL → **Query editor**

2. **Copia y pega esto:**

```sql
-- Convertir a mayúsculas
UPDATE UserProfiles SET encryptedCode = UPPER(encryptedCode);

-- Eliminar mal formateados
DELETE FROM UserProfiles WHERE encryptedCode = 'AAA';

-- Crear usuarios correctamente
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES 
  ('usr_001', 'EST-2026-A', '123', 'STUDENT', GETUTCDATE(), GETUTCDATE()),
  ('usr_002', 'EST-2026-B', '123', 'STUDENT', GETUTCDATE(), GETUTCDATE()),
  ('usr_003', 'FAM-2026-A', '123', 'PARENT', GETUTCDATE(), GETUTCDATE());

-- Verificar
SELECT id, encryptedCode, password, role FROM UserProfiles;
```

3. **Ejecuta** ✅

---

### Opción 2: Archivo SQL Completo

He creado [FIX_USERS.sql](FIX_USERS.sql) con:
- Limpiar usuarios incorrectos
- Convertir a mayúsculas
- Crear usuarios de ejemplo
- Verificar datos

**Pasos:**
1. Descarga o copia [FIX_USERS.sql](FIX_USERS.sql)
2. Abre Azure Portal → Query editor
3. Pega el contenido
4. Ejecuta

---

## 🧪 Probar el Login

### Opción A: Interfaz Web

1. Abre `http://localhost:5173`
2. Usa estos credenciales:

| Código | Contraseña | Rol |
|--------|-----------|-----|
| `EST-2026-A` | `123` | Estudiante |
| `EST-2026-B` | `123` | Estudiante |
| `FAM-2026-A` | `123` | Padre/Madre |
| `DOC-2026-A` | `123` | Docente |
| `STAFF-2026-PSI` | `staff` | Psicólogo |
| `ADM-2026-MASTER` | `admin` | Administrador |

### Opción B: Con cURL (Terminal)

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-2026-A","password":"123"}'
```

Deberías ver:
```json
{
  "id": "usr_001",
  "encryptedCode": "EST-2026-A",
  "role": "STUDENT"
}
```

---

## 🔍 Diagnóstico: Qué Está Mal

### Síntoma 1: "Código o contraseña incorrectos"

**Causas posibles:**

1. **El código no existe en la BD**
   - Solución: Ejecuta `SELECT * FROM UserProfiles`

2. **El código está en minúsculas**
   - Solución: `UPDATE UserProfiles SET encryptedCode = UPPER(encryptedCode)`

3. **La contraseña no coincide**
   - Solución: Verifica que sea exactamente `123` (o lo que pusiste)

### Síntoma 2: "Error al conectar"

**Causas posibles:**

1. El servidor no está corriendo
   - Solución: `npm run dev:server`

2. La BD no está conectada
   - Solución: Verifica `.env.local` con credenciales correctas

3. El firewall de Azure está bloqueando
   - Solución: Ve a Azure Portal → BD → Firewall → Agregar IP de desarrollo

---

## 🛠️ Checklist de Debugging

- [ ] ¿Está ejecutándose `npm run dev:server`?
- [ ] ¿Está ejecutándose `npm run dev` en otra terminal?
- [ ] ¿Revisaste que los usuarios existen? `SELECT * FROM UserProfiles`
- [ ] ¿Los códigos están en MAYÚSCULAS? (EST-2026-A, no est-2026-a)
- [ ] ¿La contraseña coincide exactamente?
- [ ] ¿El servidor responde? `GET /api/health`

---

## 🚀 Verificación Rápida

Ejecuta en terminal:

```bash
# 1. Probar API health
curl http://localhost:3000/api/health

# 2. Probar login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-2026-A","password":"123"}'

# 3. Ver usuarios en BD
# Ve a Azure Portal y ejecuta:
SELECT encryptedCode, password, role FROM UserProfiles;
```

---

## 📝 Ejemplo Completo: Crear 2 Usuarios Desde Cero

Si quieres empezar limpio:

```sql
-- Eliminar todos (CUIDADO)
DELETE FROM ChatConversations;
DELETE FROM ConflictCases;
DELETE FROM ConflictCases2;
DELETE FROM ConflictCases3;
DELETE FROM UserProfiles;

-- Crear nuevos
INSERT INTO UserProfiles (id, encryptedCode, password, role, createdAt, updatedAt)
VALUES 
  ('usr_001', 'EST-2026-A', '123', 'STUDENT', GETUTCDATE(), GETUTCDATE()),
  ('usr_002', 'EST-2026-B', '456', 'STUDENT', GETUTCDATE(), GETUTCDATE());

-- Verificar
SELECT * FROM UserProfiles;
```

Luego intenta login:
- Usuario 1: `EST-2026-A` / `123`
- Usuario 2: `EST-2026-B` / `456`

---

## ❓ ¿Aún no funciona?

1. **Revisa los logs del servidor:**
   ```bash
   npm run dev:server
   # Busca mensajes de error
   ```

2. **Verifica la conexión a BD:**
   ```bash
   # En Azure Portal:
   # Query editor → SELECT 1 (debe retornar 1)
   ```

3. **Comprueba firewall:**
   - Azure Portal → BD SQL → Firewall
   - Asegúrate que tu IP está permitida

4. **Revisa variables de entorno:**
   ```bash
   cat .env.local
   # Debe tener:
   # AZURE_SQL_SERVER=...
   # AZURE_SQL_DATABASE=cuentame_db
   # AZURE_SQL_USER=cuentame_admin
   # AZURE_SQL_PASSWORD=...
   ```

---

## 📞 Si Nada Funciona

1. Comparte el error exacto que ves
2. Ejecuta: `SELECT * FROM UserProfiles` en Azure Portal
3. Comparte el resultado

Con eso puedo diagnosticar el problema específico.

---

**Status de esta guía:** ✅ Listo para usar  
**Última actualización:** 19 de Enero de 2026
