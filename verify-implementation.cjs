#!/usr/bin/env node

/**
 * Script de Verificación de Implementación Azure Foundry
 * Verifica que todos los componentes estén correctamente implementados
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICANDO IMPLEMENTACIÓN AZURE FOUNDRY...\n');

let allPassed = true;

// Archivos que deben existir
const requiredFiles = [
  'services/azureFoundryService.ts',
  'components/ChatInterface.tsx',
  'server.js',
  'package.json',
  '.env',
  '.env.example',
  'test-azure-foundry.js',
  'AZURE_FOUNDRY_START.md',
  'AZURE_FOUNDRY_CONFIG.md',
  'MIGRACION_AZURE_FOUNDRY.md',
  'IMPLEMENTACION_AZURE_FOUNDRY_COMPLETA.md',
  'INDICE_AZURE_FOUNDRY.md',
  'RESUMEN_IMPLEMENTACION.md',
  'server-azure-foundry-example.js'
];

// Verificar archivos
console.log('📁 Verificando archivos...\n');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NO ENCONTRADO`);
    allPassed = false;
  }
});

// Verificar contenido crítico
console.log('\n📝 Verificando contenido crítico...\n');

// 1. Verificar que ChatInterface use Azure Foundry
try {
  const chatInterface = fs.readFileSync('components/ChatInterface.tsx', 'utf8');
  
  if (chatInterface.includes('sendMessageToAzureFoundry')) {
    console.log('✅ ChatInterface usa Azure Foundry');
  } else {
    console.log('❌ ChatInterface NO usa Azure Foundry');
    allPassed = false;
  }
  
  if (chatInterface.includes('geminiService') && chatInterface.includes('legacy')) {
    console.log('✅ Gemini está preservado y comentado');
  } else {
    console.log('⚠️  Verificar que Gemini esté comentado correctamente');
  }
} catch (err) {
  console.log('❌ Error leyendo ChatInterface.tsx:', err.message);
  allPassed = false;
}

// 2. Verificar endpoints en server.js
try {
  const server = fs.readFileSync('server.js', 'utf8');
  
  if (server.includes('/api/azure-foundry/chat')) {
    console.log('✅ Endpoint /api/azure-foundry/chat existe');
  } else {
    console.log('❌ Endpoint /api/azure-foundry/chat NO existe');
    allPassed = false;
  }
  
  if (server.includes('/api/azure-foundry/classify')) {
    console.log('✅ Endpoint /api/azure-foundry/classify existe');
  } else {
    console.log('❌ Endpoint /api/azure-foundry/classify NO existe');
    allPassed = false;
  }
  
  if (server.includes('import axios')) {
    console.log('✅ Axios importado en server.js');
  } else {
    console.log('❌ Axios NO importado en server.js');
    allPassed = false;
  }
  
  if (server.includes('azureFoundryConfig')) {
    console.log('✅ Configuración Azure Foundry en server.js');
  } else {
    console.log('❌ Configuración Azure Foundry NO encontrada');
    allPassed = false;
  }
} catch (err) {
  console.log('❌ Error leyendo server.js:', err.message);
  allPassed = false;
}

// 3. Verificar package.json
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.dependencies.axios) {
    console.log('✅ axios en package.json');
  } else {
    console.log('❌ axios NO está en package.json');
    allPassed = false;
  }
} catch (err) {
  console.log('❌ Error leyendo package.json:', err.message);
  allPassed = false;
}

// 4. Verificar que Gemini esté intacto
try {
  const geminiService = fs.readFileSync('services/geminiService.ts', 'utf8');
  
  if (geminiService.includes('sendMessageToGemini') && 
      geminiService.includes('classifyCaseWithGemini')) {
    console.log('✅ services/geminiService.ts intacto');
  } else {
    console.log('❌ services/geminiService.ts podría estar modificado');
    allPassed = false;
  }
} catch (err) {
  console.log('❌ Error leyendo geminiService.ts:', err.message);
  allPassed = false;
}

// 5. Verificar .env
console.log('\n⚙️  Verificando configuración...\n');
try {
  const env = fs.readFileSync('.env', 'utf8');
  
  if (env.includes('AZURE_FOUNDRY_ENDPOINT')) {
    console.log('✅ Variable AZURE_FOUNDRY_ENDPOINT en .env');
  } else {
    console.log('⚠️  Variable AZURE_FOUNDRY_ENDPOINT NO encontrada en .env');
  }
  
  if (env.includes('AZURE_FOUNDRY_API_KEY')) {
    console.log('✅ Variable AZURE_FOUNDRY_API_KEY en .env');
  } else {
    console.log('⚠️  Variable AZURE_FOUNDRY_API_KEY NO encontrada en .env');
  }
  
  if (env.includes('your-') || env.includes('tu-')) {
    console.log('⚠️  Las credenciales en .env son valores de ejemplo');
    console.log('   → Configura tus credenciales reales de Azure Foundry');
  } else {
    console.log('✅ Las credenciales parecen estar configuradas');
  }
} catch (err) {
  console.log('❌ Error leyendo .env:', err.message);
}

// Resumen
console.log('\n' + '═'.repeat(60));
if (allPassed) {
  console.log('✅ VERIFICACIÓN COMPLETA - IMPLEMENTACIÓN CORRECTA');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Configura tus credenciales en .env');
  console.log('   2. npm run dev:server');
  console.log('   3. npm run dev (en otra terminal)');
  console.log('   4. node test-azure-foundry.js');
} else {
  console.log('❌ VERIFICACIÓN FALLIDA - HAY PROBLEMAS');
  console.log('\n📝 Revisa los errores arriba y corrige los archivos faltantes.');
}
console.log('═'.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
