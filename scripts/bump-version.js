#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'version.json');

// Leer versión actual
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const currentVersion = versionData.version;

// Parsear versión
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Incrementar patch por defecto (puede modificarse con argumentos)
const bumpType = process.argv[2] || 'patch';
let newVersion;

switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
}

// Actualizar archivo
versionData.version = newVersion;
versionData.lastUpdate = new Date().toISOString();

// Obtener último commit hash si es posible
try {
  const { execSync } = require('child_process');
  const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
  versionData.lastCommit = commitHash;
} catch (e) {
  console.log('No se pudo obtener el hash del commit');
}

fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

// También copiar a frontend/public para que sea accesible
const publicVersionFile = path.join(__dirname, '..', 'frontend', 'public', 'version.json');
fs.writeFileSync(publicVersionFile, JSON.stringify(versionData, null, 2));

console.log(`Versión actualizada: ${currentVersion} → ${newVersion}`);