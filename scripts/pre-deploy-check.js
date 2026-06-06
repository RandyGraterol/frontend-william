#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * Checks that all necessary files and configurations are in place
 */

import { existsSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  'netlify.toml',
  'public/_redirects',
  'package.json',
  'vite.config.ts',
  'index.html',
  'src/App.tsx',
];

const requiredDirs = [
  'src',
  'public',
];

console.log('🔍 Verificando configuración de despliegue...\n');

let hasErrors = false;

// Check required files
console.log('📄 Verificando archivos requeridos:');
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
  if (!exists) hasErrors = true;
});

console.log('\n📁 Verificando directorios requeridos:');
requiredDirs.forEach(dir => {
  const exists = existsSync(dir);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${dir}`);
  if (!exists) hasErrors = true;
});

console.log('\n🔧 Verificando configuración de Netlify:');

// Check netlify.toml content
if (existsSync('netlify.toml')) {
  const netlifyConfig = require('fs').readFileSync('netlify.toml', 'utf-8');
  const hasPublish = netlifyConfig.includes('publish = "dist"');
  const hasBuildCommand = netlifyConfig.includes('command = "npm run build"');
  const hasRedirects = netlifyConfig.includes('[[redirects]]');
  
  console.log(`  ${hasPublish ? '✅' : '❌'} Directorio de publicación configurado`);
  console.log(`  ${hasBuildCommand ? '✅' : '❌'} Comando de build configurado`);
  console.log(`  ${hasRedirects ? '✅' : '❌'} Redirects para SPA configurados`);
  
  if (!hasPublish || !hasBuildCommand || !hasRedirects) hasErrors = true;
}

// Check _redirects file
if (existsSync('public/_redirects')) {
  const redirects = require('fs').readFileSync('public/_redirects', 'utf-8');
  const hasSPARedirect = redirects.includes('/*') && redirects.includes('/index.html');
  console.log(`  ${hasSPARedirect ? '✅' : '❌'} Archivo _redirects configurado correctamente`);
  if (!hasSPARedirect) hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Se encontraron errores en la configuración');
  console.log('Por favor, revisa los archivos faltantes o mal configurados');
  process.exit(1);
} else {
  console.log('✅ Todas las verificaciones pasaron correctamente');
  console.log('El proyecto está listo para desplegarse en Netlify');
  process.exit(0);
}
