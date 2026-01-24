/**
 * Script de Prueba Rápida - Azure Foundry Integration
 * 
 * Este script prueba los endpoints de Azure Foundry para verificar
 * que la integración esté funcionando correctamente.
 * 
 * USO:
 * 1. Asegúrate de que el servidor esté corriendo: npm run dev:server
 * 2. Ejecuta: node test-azure-foundry.js
 */

const API_BASE = 'http://localhost:3000';

console.log('🧪 Iniciando pruebas de Azure Foundry Integration...\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('📡 Test 1: Health Check');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('✅ Servidor respondiendo:', data);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 2: Azure Foundry Chat Endpoint
async function testAzureFoundryChat() {
  console.log('\n📡 Test 2: Azure Foundry Chat Endpoint');
  try {
    const response = await fetch(`${API_BASE}/api/azure-foundry/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [],
        newMessage: 'Hola, ¿cómo estás?',
        userRole: 'student'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('⚠️  Endpoint existe pero:', error.error);
      if (error.error === 'Azure Foundry not configured') {
        console.log('ℹ️  Esto es normal si aún no has configurado las credenciales en .env');
      }
      return false;
    }

    const data = await response.json();
    console.log('✅ Respuesta recibida:', data.response.substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 3: Azure Foundry Classification Endpoint
async function testAzureFoundryClassification() {
  console.log('\n📡 Test 3: Azure Foundry Classification Endpoint');
  try {
    const response = await fetch(`${API_BASE}/api/azure-foundry/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { sender: 'user', text: 'Me están molestando mucho en la escuela' },
          { sender: 'ai', text: '¿Puedes contarme más sobre eso?' },
          { sender: 'user', text: 'Unos compañeros me insultan todos los días' }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('⚠️  Endpoint existe pero:', error.error);
      if (error.error === 'Azure Foundry not configured') {
        console.log('ℹ️  Esto es normal si aún no has configurado las credenciales en .env');
      }
      return false;
    }

    const data = await response.json();
    console.log('✅ Clasificación recibida:');
    console.log('   - Tipología:', data.typology);
    console.log('   - Nivel de riesgo:', data.riskLevel);
    console.log('   - Resumen:', data.summary.substring(0, 80) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Test 4: Gemini Chat Endpoint (Legacy - debe seguir funcionando)
async function testGeminiChat() {
  console.log('\n📡 Test 4: Gemini Chat Endpoint (Legacy)');
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        history: [],
        newMessage: 'Hola',
        userRole: 'student'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('⚠️  Endpoint de Gemini:', error.error);
      return false;
    }

    const data = await response.json();
    console.log('✅ Gemini sigue disponible:', data.response.substring(0, 50) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = {
    healthCheck: await testHealthCheck(),
    azureChat: await testAzureFoundryChat(),
    azureClassification: await testAzureFoundryClassification(),
    geminiLegacy: await testGeminiChat()
  };

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE PRUEBAS\n');
  console.log(`Health Check:              ${results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Azure Foundry Chat:        ${results.azureChat ? '✅ PASS' : '⚠️  NO CONFIG'}`);
  console.log(`Azure Foundry Classify:    ${results.azureClassification ? '✅ PASS' : '⚠️  NO CONFIG'}`);
  console.log(`Gemini Legacy:             ${results.geminiLegacy ? '✅ PASS' : '⚠️  NO CONFIG'}`);
  
  console.log('\n═══════════════════════════════════════════════════════');
  
  if (!results.healthCheck) {
    console.log('\n❌ El servidor no está corriendo. Inicia con: npm run dev:server');
  } else if (!results.azureChat || !results.azureClassification) {
    console.log('\n⚠️  Azure Foundry no está configurado.');
    console.log('   Para configurarlo:');
    console.log('   1. Edita el archivo .env');
    console.log('   2. Agrega tus credenciales de Azure Foundry');
    console.log('   3. Reinicia el servidor');
    console.log('\n   Ver: AZURE_FOUNDRY_CONFIG.md para más detalles');
  } else {
    console.log('\n🎉 ¡Todos los tests pasaron! Azure Foundry está funcionando correctamente.');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Ejecutar
runAllTests().catch(err => {
  console.error('\n❌ Error ejecutando tests:', err);
  process.exit(1);
});
