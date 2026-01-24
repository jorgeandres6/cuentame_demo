# 📦 Azure Blob Storage para Evidencias - Guía de Configuración

## 🎯 Resumen

Se ha implementado **Azure Blob Storage** para la gestión de evidencias en casos de conflicto. Los usuarios (Estudiante/Familiar/Docente) pueden subir evidencias desde su vista de casos, y el Staff puede visualizarlas en la gestión de casos.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐
│   Usuario Normal    │
│ (Est/Fam/Doc)       │
│                     │
│ • Sube evidencias   │
│   desde "Mis Casos" │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│   Backend API       │◄────►│  Azure Blob      │
│   (server.js)       │      │  Storage         │
│                     │      │  (case-evidence) │
│ • Genera SAS tokens │      └──────────────────┘
│ • Valida archivos   │
│ • Registra metadata │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Azure SQL DB      │
│   (CaseEvidence)    │
│                     │
│ • id, fileName      │
│ • blobName, caseId  │
│ • uploadedBy, etc.  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Staff View        │
│   (CaseDetail.tsx)  │
│                     │
│ • Ve evidencias     │
│ • Descarga archivos │
└─────────────────────┘
```

---

## 📋 Paso 1: Crear Storage Account en Azure

### 1.1 Acceder al Portal

1. Ir a [Azure Portal](https://portal.azure.com)
2. Login con tu cuenta institucional

### 1.2 Crear Storage Account

1. Click en **"Create a resource"**
2. Buscar **"Storage account"**
3. Click **"Create"**

### 1.3 Configuración Básica

- **Subscription**: Selecciona tu suscripción
- **Resource Group**: Usar el mismo que tu Web App (ej: `cuentame-rg`)
- **Storage account name**: `cuentameevidencias` (debe ser único globalmente, todo minúsculas, sin espacios)
- **Region**: La misma región que tu Web App (ej: `East US`)
- **Performance**: **Standard**
- **Redundancy**: **LRS** (Locally Redundant Storage - más económico)

### 1.4 Configuración Avanzada

- **Secure transfer required**: **Enabled**
- **Blob public access**: **Disabled** (privado)
- **Minimum TLS version**: **Version 1.2**

### 1.5 Networking

- **Network connectivity**: **Public endpoint (all networks)**

### 1.6 Revisar y Crear

1. Click **"Review + create"**
2. Esperar validación
3. Click **"Create"**
4. Esperar deployment (~2 minutos)

---

## 📦 Paso 2: Crear Contenedor de Blobs

### 2.1 Acceder al Storage Account

1. En Azure Portal, ir a **"Storage accounts"**
2. Seleccionar `cuentameevidencias`

### 2.2 Crear Contenedor

1. En el menú lateral, ir a **"Containers"**
2. Click **"+ Container"**
3. Configuración:
   - **Name**: `case-evidence`
   - **Public access level**: **Private (no anonymous access)**
4. Click **"Create"**

---

## 🔑 Paso 3: Obtener Credenciales

### 3.1 Access Keys

1. En el Storage Account, ir a **"Access keys"** (menú lateral)
2. Click **"Show keys"**
3. Copiar:
   - **Storage account name**: `cuentameevidencias`
   - **Key1** (cadena larga tipo `abc123...==`)

⚠️ **IMPORTANTE**: Estas keys son secretas. No las compartas ni las subas a repositorios públicos.

---

## ⚙️ Paso 4: Configurar Variables de Entorno

### 4.1 Desarrollo Local

Editar `.env.local`:

```env
# Azure SQL Database Configuration
AZURE_SQL_SERVER=tu-servidor.database.windows.net
AZURE_SQL_DATABASE=cuentame_db
AZURE_SQL_USER=tu_usuario
AZURE_SQL_PASSWORD=tu_password

# Azure Blob Storage - Evidencias
AZURE_STORAGE_ACCOUNT=cuentameevidencias
AZURE_STORAGE_KEY=tu_key1_aqui==
AZURE_STORAGE_CONTAINER=case-evidence

# API Configuration
REACT_APP_API_URL=http://localhost:3000
PORT=3000

# Gemini API Key
GEMINI_API_KEY=tu_gemini_api_key

# Environment
NODE_ENV=development
```

### 4.2 Producción (Azure Web App)

1. Ir a tu **Web App** en Azure Portal
2. Menú lateral → **"Configuration"**
3. Click **"Application settings"**
4. Click **"+ New application setting"** para cada una:

```
Name: AZURE_STORAGE_ACCOUNT
Value: cuentameevidencias

Name: AZURE_STORAGE_KEY
Value: [pegar Key1 aquí]

Name: AZURE_STORAGE_CONTAINER
Value: case-evidence
```

5. Click **"Save"** arriba
6. Confirmar **"Continue"**
7. La app se reiniciará automáticamente

---

## 🗄️ Paso 5: Verificar Base de Datos

La tabla `CaseEvidence` se crea automáticamente al iniciar el servidor.

### Verificar Manualmente (Opcional)

Si quieres verificar que la tabla existe:

```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'CaseEvidence';

-- Si existe, ver estructura:
SELECT * FROM CaseEvidence;
```

### Esquema de la Tabla

```sql
CREATE TABLE CaseEvidence (
    id NVARCHAR(50) PRIMARY KEY,              -- ev_1234567890
    caseId NVARCHAR(50) NOT NULL,             -- case_abc123
    blobName NVARCHAR(500) NOT NULL,          -- case_abc123/1234567890_archivo.pdf
    fileName NVARCHAR(255) NOT NULL,          -- archivo.pdf
    contentType NVARCHAR(100),                -- application/pdf
    fileSize BIGINT,                          -- 102400 (bytes)
    uploadedBy NVARCHAR(50),                  -- EST-2026-A
    uploadedByRole NVARCHAR(20),              -- STUDENT
    createdAt DATETIME DEFAULT GETUTCDATE(),  -- 2026-01-21 10:30:00
    deletedAt DATETIME NULL,                  -- NULL (activo)
    INDEX idx_case (caseId),
    INDEX idx_deleted (deletedAt)
);
```

---

## 🧪 Paso 6: Probar el Sistema

### 6.1 Probar Subida de Evidencias (Usuario)

1. **Login** como usuario normal (Estudiante/Familiar/Docente)
2. Ir a pestaña **"Mis Casos"**
3. Seleccionar un caso existente
4. Click en botón **"CARGAR EVIDENCIAS"**
5. Seleccionar archivo:
   - ✅ Imágenes: JPG, PNG, GIF, WEBP
   - ✅ Documentos: PDF, DOC, DOCX
   - ❌ Máximo: 10MB
6. Esperar mensaje: **"✅ Evidencia subida correctamente"**
7. Verificar que aparece en la lista

### 6.2 Probar Visualización (Staff)

1. **Login** como STAFF o ADMIN
2. Ir a **"Dashboard"**
3. Seleccionar un caso que tenga evidencias
4. Scroll hasta sección **"8. Evidencias del Caso"**
5. Verificar:
   - Ver preview de imágenes
   - Ver íconos para PDFs/documentos
   - Click **"👁️ Ver/Descargar"** → Abre en nueva pestaña

### 6.3 Verificar en Azure Portal

1. Ir a Storage Account → **"Containers"**
2. Click en `case-evidence`
3. Verificar estructura:
   ```
   case-evidence/
   ├── case_1234567890/
   │   ├── 1706600000000_evidencia.pdf
   │   └── 1706600001000_foto.jpg
   └── case_0987654321/
       └── 1706600002000_documento.docx
   ```

---

## 🔒 Seguridad Implementada

### SAS Tokens (Shared Access Signatures)

- **Upload**: Token de solo escritura (`w`), válido 1 hora
- **Download**: Token de solo lectura (`r`), válido 1 hora
- Las keys nunca se exponen al frontend

### Validaciones Backend

```javascript
// Tipos permitidos
['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
 'application/pdf', 'application/msword', 
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

// Tamaño máximo
10 * 1024 * 1024  // 10MB
```

### Soft Delete

- No se eliminan físicamente de inmediato
- Se marca `deletedAt` en BD
- Se puede recuperar o purgar después

---

## 📊 Monitoreo y Métricas

### Logs del Backend

```bash
# Ver logs en desarrollo local
npm start

# Buscar mensajes:
✅ Azure Blob Storage configured
🔐 Generando SAS para subir evidencia
✅ SAS generado para: case_123/...
📝 Registrando evidencia
✅ Evidencia registrada: ev_...
📋 Listando evidencias del caso
✅ X evidencias encontradas
```

### Azure Portal - Storage Metrics

1. Ir a Storage Account → **"Metrics"**
2. Ver gráficas:
   - **Blob Count**: Número de archivos
   - **Blob Capacity**: Espacio usado
   - **Transactions**: Operaciones (upload/download)
   - **Egress**: Tráfico saliente

---

## 💰 Costos Estimados

### Pricing (East US - Enero 2026)

- **Storage (Hot tier)**: $0.018 por GB/mes
- **Write operations**: $0.05 por 10,000 operaciones
- **Read operations**: $0.004 por 10,000 operaciones
- **Bandwidth**: Primeros 5GB gratis/mes

### Ejemplo Real

**Escenario**: Colegio con 500 estudiantes
- 100 casos activos por mes
- 3 evidencias promedio por caso (500KB cada una)
- Total: 100 × 3 × 0.5MB = 150MB/mes
- **Costo mensual**: ~$0.01 USD + operaciones ≈ **$0.05 USD/mes**

---

## 🚨 Troubleshooting

### Error: "Azure Blob Storage not configured"

**Causa**: Variables de entorno faltantes

**Solución**:
1. Verificar `.env.local` tiene `AZURE_STORAGE_ACCOUNT` y `AZURE_STORAGE_KEY`
2. En Azure Web App, verificar en **Configuration** → **Application settings**
3. Reiniciar servidor: `npm start` (local) o restart Web App (Azure)

### Error: "File type not allowed"

**Causa**: Intentando subir tipo no soportado (.exe, .zip, etc.)

**Solución**: Solo usar formatos permitidos (ver lista arriba)

### Error: "File size exceeds 10MB limit"

**Causa**: Archivo muy grande

**Solución**:
- Comprimir imagen con herramientas online
- Dividir PDF en partes más pequeñas
- Para videos, usar link externo en lugar de subir

### Error 403 al ver evidencia

**Causa**: SAS token expiró (>1 hora)

**Solución**: Recargar la página del caso, se generarán nuevos tokens

### Blob no aparece en Azure Portal

**Causa**: Upload falló pero BD tiene registro

**Solución**:
1. Verificar logs del navegador (F12 → Console)
2. Verificar en Storage Browser si blob existe
3. Si no existe, eliminar registro de BD:
   ```sql
   DELETE FROM CaseEvidence WHERE id = 'ev_xxx';
   ```

---

## ✅ Checklist de Implementación

- [x] Crear Storage Account en Azure
- [x] Crear contenedor `case-evidence`
- [x] Obtener Access Keys
- [x] Configurar variables de entorno (local y producción)
- [x] Instalar `@azure/storage-blob` en backend
- [x] Crear tabla `CaseEvidence` en SQL
- [x] Implementar endpoints de backend
- [x] Actualizar frontend (UserCaseDetailView)
- [x] Actualizar frontend (CaseDetail para Staff)
- [x] Probar subida de evidencias
- [x] Probar visualización desde Staff
- [x] Verificar seguridad (SAS tokens)

---

## 🔗 Referencias

- [Azure Blob Storage Docs](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDK for Node.js](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/storage/storage-blob)
- [SAS Tokens Overview](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)

---

**Última actualización**: 21 de enero de 2026  
**Versión**: 1.0.0  
**Autor**: Sistema CUÉNTAME
