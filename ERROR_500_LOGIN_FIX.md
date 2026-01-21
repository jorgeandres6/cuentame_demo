# 🔴 ERROR 500: Internal Server Error en Login

## ⚠️ El Problema
```
POST https://cuentame.azurewebsites.net/api/users/login → 500 Error
```

El servidor está fallando al procesar tu request.

---

## 🔍 Causas Posibles (en orden de probabilidad)

1. **Base de Datos No Conecta** ← Más común
2. Variables de entorno incorrectas en Azure
3. Usuarios no existen en la BD
4. Error en la query SQL

---

## 🚨 PASO 1: Ver los Logs de Error (CRÍTICO)

### Opción A: Desde Azure Portal (Más Fácil)

1. **Azure Portal** → App Service → `cuentame-app`
2. En menú lateral busca: **Log Stream**
3. Espera a que se conecte
4. Intenta hacer login desde el navegador
5. **Copia el error exacto que aparece**

### Opción B: Desde VSCode

1. Pestaña Azure
2. Clic derecho en `cuentame-app`
3. **View Stream Logs**
4. Intenta login
5. **Copia el error**

### Opción C: SSH a la App

1. **Azure Portal** → `cuentame-app` → **SSH**
2. Ejecuta:
```bash
# Ver logs recientes
tail -50 /var/log/LogFiles/Application/default_docker.log

# O si está en PM2
pm2 logs cuentame-app --lines 50
```

---

## 🔧 PASO 2: Verificar Variables de Entorno en Azure

Las variables de entorno NO se detectan automáticamente. **Debes configurarlas manualmente**.

### En Azure Portal:

1. **Azure Portal** → `cuentame-app`
2. En menú lateral: **Configuration** (o Settings)
3. Busca sección: **Application Settings** o **Environment Variables**
4. Verifica que EXISTEN:
   ```
   AZURE_SQL_SERVER
   AZURE_SQL_DATABASE
   AZURE_SQL_USER
   AZURE_SQL_PASSWORD
   REACT_APP_API_URL
   PORT
   GEMINI_API_KEY
   ```

### Si Faltan Variables:

1. Haz clic en **+ New application setting**
2. Agrega cada una:
   ```
   AZURE_SQL_SERVER = cuentame-server-XXX.database.windows.net
   AZURE_SQL_DATABASE = cuentame_db
   AZURE_SQL_USER = cuentame_admin
   AZURE_SQL_PASSWORD = Tu-Password-Fuerte-2026
   REACT_APP_API_URL = https://cuentame-app.azurewebsites.net
   PORT = 3000
   GEMINI_API_KEY = tu_gemini_key
   ```

3. Haz clic en **Save** (arriba)
4. La app se reiniciará automáticamente

---

## 🛠️ PASO 3: Verificar Conexión a BD

Ejecuta en terminal local (NO en Azure):

```bash
# Instalar herramienta sqlcmd (si no la tienes)
# O usa Azure Data Studio

# Probar conexión
sqlcmd -S cuentame-server-XXX.database.windows.net -U cuentame_admin -P "Tu-Password" -d cuentame_db -Q "SELECT 1"

# Debe retornar: 1

# Si no funciona: error de credenciales
```

---

## 🔍 PASO 4: Verificar Usuarios en BD

En **Azure Portal → cuentame-app → Query Editor**:

```sql
SELECT id, encryptedCode, password, role FROM UserProfiles;

-- Debe retornar al menos 2 usuarios
-- Ejemplo:
-- id         | encryptedCode | password | role
-- usr_001    | EST-2026-A    | 123      | STUDENT
-- usr_002    | EST-2026-B    | 123      | STUDENT
```

Si no retorna nada, **necesitas crear usuarios** (ver SOLUCION_LOGIN.md)

---

## 📋 Checklist de Debugging

- [ ] Viste los logs en Azure Portal
- [ ] Las variables de entorno están configuradas en Azure
- [ ] Conectaste exitosamente a la BD desde local
- [ ] Hay usuarios en la tabla UserProfiles
- [ ] Los códigos están en MAYÚSCULAS (EST-2026-A, no est-2026-a)

---

## 🚀 Solución Rápida: Configurar Variables en Azure

**Este es probablemente tu problema:**

1. **Azure Portal** → `cuentame-app` → **Configuration**

2. Haz clic en **Application settings**

3. Verifica que existen TODAS estas variables:
   ```
   ✓ AZURE_SQL_SERVER
   ✓ AZURE_SQL_DATABASE
   ✓ AZURE_SQL_USER
   ✓ AZURE_SQL_PASSWORD
   ✓ REACT_APP_API_URL
   ✓ PORT
   ✓ GEMINI_API_KEY
   ```

4. Si faltan, agrégalas

5. Haz clic en **Save** (arriba)

6. Espera a que la app se reinicie (1-2 minutos)

7. Intenta login de nuevo

---

## 🆘 Si Aún Falla

### Paso 1: Ve a Azure Portal → Log Stream

Copia el **error exacto** que ves

### Paso 2: Comparte Conmigo

Envía:
- El error exacto del Log Stream
- Credenciales de conexión a BD (sin la contraseña completa)
- Resultado de: `SELECT * FROM UserProfiles`

Con eso puedo darte la solución exacta.

---

## 💡 Problema Más Común

**99% de los casos es esto:**

Las variables de entorno no están configuradas en Azure Portal.

**Solución:**
1. Azure Portal → cuentame-app → Configuration
2. Agrega las 7 variables
3. Save
4. Espera 2 minutos
5. Intenta login de nuevo

---

**Status:** 🔴 Necesita configuración en Azure  
**Tiempo para arreglarlo:** 5 minutos
