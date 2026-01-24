# 🚀 Guía de Integración Azure SQL Database - CUÉNTAME

## 1. Crear Base de Datos en Azure Portal

### Crear SQL Database:
1. Ir a **Azure Portal** → **Crear recurso** → **Base de datos SQL**
2. **Detalles del proyecto:**
   - Suscripción: Tu suscripción Azure
   - Grupo de recursos: Crear nuevo (ej: `cuentame-rg`)
3. **Detalles de base de datos:**
   - Nombre BD: `cuentame_db`
   - Servidor: Crear nuevo → `cuentame-server-[region]`
4. **Autenticación SQL:**
   - Admin: `cuentame_admin`
   - Contraseña: `Tu-Password-Fuerte-2026`
5. **Configuración:**
   - Proceso: DTU Básico (5 DTU = ~$5 USD/mes)
   - Almacenamiento: 2 GB
6. Hacer clic en **Crear**

### Configurar Firewall:
1. Ir a la BD → **Seguridad** → **Firewall y redes virtuales**
2. Agregar regla:
   - Nombre: `Azure Services`
   - Desde: `0.0.0.0` → Hasta: `255.255.255.255`
3. **Guardar**

## 2. Ejecutar Script SQL para crear tablas

Ir a **Recurso de Base de datos** → **Editor de consultas** → Ejecutar:

```sql
-- Crear tabla de usuarios (Solo datos mínimos por privacidad)
CREATE TABLE UserProfiles (
    id NVARCHAR(50) PRIMARY KEY,
    encryptedCode NVARCHAR(50) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(20) NOT NULL,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE()
);

-- Crear tabla de casos
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

-- Crear tabla de chats (Para almacenar conversaciones completas)
CREATE TABLE ChatConversations (
    id NVARCHAR(50) PRIMARY KEY,
    encryptedUserCode NVARCHAR(50) NOT NULL,
    caseId NVARCHAR(50),
    topic NVARCHAR(255) NOT NULL,
    messages NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME DEFAULT GETUTCDATE(),
    updatedAt DATETIME DEFAULT GETUTCDATE(),
    status NVARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (encryptedUserCode) REFERENCES UserProfiles(encryptedCode),
    FOREIGN KEY (caseId) REFERENCES ConflictCases(id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_userCode ON ConflictCases(encryptedUserCode);
CREATE INDEX idx_status ON ConflictCases(status);
CREATE INDEX idx_riskLevel ON ConflictCases(riskLevel);
CREATE INDEX idx_chatUserCode ON ChatConversations(encryptedUserCode);
CREATE INDEX idx_chatStatus ON ChatConversations(status);
CREATE INDEX idx_chatCaseId ON ChatConversations(caseId);
```

## 3. Obtener Credenciales de Conexión

1. Ir a **Base de datos SQL** → **Cadenas de conexión**
2. Copiar la URL del servidor: `cuentame-server-XXXX.database.windows.net`
3. Usuario: `cuentame_admin`
4. Contraseña: Tu-Password-Fuerte-2026

## 4. Actualizar Archivo `.env.local`

```env
# Desarrollo
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password-Fuerte-2026
REACT_APP_API_URL=http://localhost:3000
PORT=3000
GEMINI_API_KEY=tu_gemini_key
```

## 5. Actualizar `.env.production`

```env
# Producción
AZURE_SQL_SERVER=cuentame-server-XXX.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=cuentame_admin
AZURE_SQL_PASSWORD=Tu-Password-Fuerte-2026
REACT_APP_API_URL=https://tu-app.azurewebsites.net
PORT=3000
GEMINI_API_KEY=tu_gemini_key
```

## 6. Desplegar en Azure App Service

```powershell
# 1. Compilar
npm run build

# 2. Crear Azure App Service
az appservice plan create --name cuentame-plan --resource-group cuentame-rg --sku B1 --is-linux

az webapp create --resource-group cuentame-rg --plan cuentame-plan --name cuentame-app --runtime "node|18"

# 3. Configurar variables de entorno en Azure
az webapp config appsettings set --resource-group cuentame-rg --name cuentame-app --settings \
  AZURE_SQL_SERVER="cuentame-server-XXX.database.windows.net" \
  AZURE_SQL_DATABASE="cuentame_db" \
  AZURE_SQL_USER="cuentame_admin" \
  AZURE_SQL_PASSWORD="Tu-Password-Fuerte-2026" \
  REACT_APP_API_URL="https://cuentame-app.azurewebsites.net" \
  GEMINI_API_KEY="tu_gemini_key"

# 4. Desplegar código
npm run build
zip -r app.zip dist server.js package.json package-lock.json node_modules/
az webapp deployment source config-zip --resource-group cuentame-rg --name cuentame-app --src app.zip
```

## 7. Verificar Conexión

Acceder a: `https://tu-app.azurewebsites.net/api/health`

Deberías ver: `{"status":"ok"}`

## 8. Testing de la API

```bash
# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"code":"EST-2026-XXXX","password":"123"}'

# Obtener casos
curl http://localhost:3000/api/cases

# Guardar caso
curl -X POST http://localhost:3000/api/cases/save \
  -H "Content-Type: application/json" \
  -d '{
    "id":"case_123",
    "encryptedUserCode":"EST-2026-XXXX",
    "reporterRole":"student",
    "status":"OPEN",
    "typology":"Conflicto leve entre pares",
    "riskLevel":"MEDIUM",
    "summary":"Descripción del caso",
    "recommendations":["Medida 1","Medida 2"],
    "messages":[],
    "interventions":[],
    "evidence":[]
  }'

# Guardar un chat completo
curl -X POST http://localhost:3000/api/chats/save \
  -H "Content-Type: application/json" \
  -d '{
    "id":"chat_123",
    "encryptedUserCode":"EST-2026-XXXX",
    "topic":"Reporte de Conflicto",
    "messages":[
      {
        "id":"msg_1",
        "role":"user",
        "content":"Hola, necesito reportar un conflicto",
        "timestamp":"2026-01-19T10:30:00Z"
      },
      {
        "id":"msg_2",
        "role":"assistant",
        "content":"Te escucho, cuéntame qué pasó",
        "timestamp":"2026-01-19T10:30:05Z"
      }
    ],
    "status":"ACTIVE"
  }'

# Obtener todos los chats de un usuario
curl http://localhost:3000/api/chats/EST-2026-XXXX

# Obtener mensajes de un chat específico
curl http://localhost:3000/api/chats/chat_123/messages

# Agregar un mensaje a un chat
curl -X POST http://localhost:3000/api/chats/chat_123/message \
  -H "Content-Type: application/json" \
  -d '{
    "role":"user",
    "content":"Este es un nuevo mensaje"
  }'

# Archivar un chat
curl -X PUT http://localhost:3000/api/chats/chat_123/archive
```

## 📊 Costos Estimados (Mensual)

- **SQL Database (DTU Básico)**: $5 USD
- **App Service (B1 Plan)**: $12 USD
- **Total**: ~$17 USD/mes

## 🔒 Seguridad

1. **Usar Azure Key Vault** para credenciales en producción
2. **Habilitar SSL/TLS** en App Service
3. **Restricciones de firewall** en base de datos
4. **Auditoría de SQL** habilitada
5. **Copias de seguridad** automáticas (habilitadas por defecto)

## 🆘 Solucionar Problemas

### Conexión rechazada
- Verificar firewall: **Seguridad** → **Firewall**
- Revisar credenciales en `.env`

### Tablas no existen
- Ejecutar script SQL en **Editor de consultas**

### Aplicación lenta
- Aumentar DTU en Azure Portal
- Revisar índices en base de datos

## ✅ Checklist Final

- [ ] BD creada en Azure
- [ ] Firewall configurado
- [ ] Tablas creadas
- [ ] `.env` actualizado con credenciales
- [ ] Servidor Node.js inicia sin errores
- [ ] API responde en `/api/health`
- [ ] Casos se guardan en Azure SQL
- [ ] Usuarios pueden login
