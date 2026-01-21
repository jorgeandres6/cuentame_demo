# 📋 Resumen de Cambios - Integración Azure SQL Database

## ✅ Cambios Realizados

### 1. **Archivos de Configuración**
- ✅ `.env.local` - Variables para desarrollo
- ✅ `.env.production` - Variables para producción

### 2. **Servidor Node.js** (`server.js`)
- ✅ Configuración de Azure SQL con variables de entorno
- ✅ Pool de conexión persistente
- ✅ Creación automática de tablas al iniciar
- ✅ **Endpoints implementados:**
  - `POST /api/users/register` - Registrar nuevo usuario
  - `POST /api/users/login` - Login de usuario
  - `GET /api/users/profile/:code` - Obtener perfil
  - `PUT /api/users/profile/:id` - Actualizar perfil
  - `POST /api/cases/save` - Guardar/actualizar caso
  - `GET /api/cases` - Obtener todos los casos
  - `GET /api/cases/user/:code` - Obtener casos de usuario

### 3. **Servicio de Almacenamiento** (`services/storageService.ts`)
- ✅ Migración de localStorage a API REST
- ✅ Todas las funciones ahora usan fetch
- ✅ URL de API dinámica (desarrollo/producción)
- ✅ Manejo de errores mejorado
- ✅ **Funciones actualizadas:**
  - `loginUserByCredentials()` - async
  - `getUserProfileByCode()` - async
  - `saveUserProfile()` - async
  - `registerNewUser()` - async
  - `saveCase()` - async
  - `getCases()` - async
  - `getCasesByUserCode()` - async
  - `addNotificationToUser()` - async
  - `replyToNotification()` - async

### 4. **Scripts Inicializadores**
- ✅ `seedDatabase.js` - Inicializar BD con datos de prueba
- ✅ Script SQL para crear tablas
- ✅ Usuarios demo precargados

### 5. **Documentación**
- ✅ `AZURE_SETUP.md` - Guía completa de configuración
  - Paso a paso para crear BD
  - Scripts SQL
  - Configuración de firewall
  - Testing de API
  - Troubleshooting

### 6. **package.json**
- ✅ Agregado script `npm run seed`
- ✅ Dependencias `mssql` y `dotenv` ya presentes

---

## 🚀 Próximos Pasos

### Fase 1: Configuración Local (Esta semana)
1. Crear Azure SQL Database en Azure Portal
2. Obtener credenciales de conexión
3. Ejecutar script SQL para crear tablas
4. Actualizar `.env.local` con credenciales
5. Instalar dependencias: `npm install`
6. Inicializar datos: `npm run seed`
7. Iniciar servidor: `npm run dev:server`
8. Iniciar frontend: `npm run dev`

### Fase 2: Testing
1. Login con usuario demo
2. Guardar caso nuevo
3. Verificar datos en Azure SQL (Query Editor)
4. Obtener casos desde API

### Fase 3: Despliegue en Azure
1. Crear Azure App Service
2. Configurar variables de entorno en Azure
3. Build: `npm run build`
4. Desplegar código
5. Verificar funcionamiento en producción

---

## 📊 Estructura de Tablas Azure SQL

### UserProfiles
```
id (PK)
fullName
encryptedCode (UNIQUE)
password
role (student|parent|teacher|admin|staff)
phone
grade
email
demographics (JSON)
psychographics (JSON)
notifications (JSON)
createdAt
updatedAt
```

### ConflictCases
```
id (PK)
encryptedUserCode (FK)
reporterRole
status (OPEN|IN_PROGRESS|RESOLVED|CLOSED)
typology (MINEDUC)
riskLevel (LOW|MEDIUM|HIGH|CRITICAL)
summary
recommendations (JSON)
assignedProtocol
assignedTo
messages (JSON)
interventions (JSON)
evidence (JSON)
createdAt
updatedAt
```

---

## 🔑 Variables de Entorno Requeridas

```env
AZURE_SQL_SERVER=tu-servidor.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=tu_usuario
AZURE_SQL_PASSWORD=tu_password
REACT_APP_API_URL=http://localhost:3000 (dev) o https://tu-app.azurewebsites.net (prod)
PORT=3000
GEMINI_API_KEY=tu_gemini_key
NODE_ENV=development|production
```

---

## ⚠️ Consideraciones Importantes

1. **Seguridad:**
   - No hacer commit de `.env` o `.env.production`
   - Usar Azure Key Vault en producción
   - Cambiar contraseña de admin de BD

2. **Rendering:**
   - Las funciones async requieren await en componentes React
   - Usar useEffect para llamadas de API
   - Manejar estados de carga

3. **Errores de Conexión:**
   - Si falla, verificar firewall de SQL
   - Confirmar credenciales en `.env`
   - Revisar logs del servidor

---

## 📞 Soporte

Para preguntas:
1. Revisar `AZURE_SETUP.md` - Sección Troubleshooting
2. Verificar logs del servidor: `npm run dev:server`
3. Usar Query Editor en Azure Portal para validar datos
