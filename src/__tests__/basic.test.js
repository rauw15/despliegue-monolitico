// Tests básicos que no requieren base de datos
describe('Basic Tests', () => {
  test('should pass basic math test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should verify package.json exists', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.name).toBe('despliegue-monolitico');
    expect(packageJson.version).toBe('1.0.0');
  });

  test('should verify Express is installed', () => {
    const express = require('express');
    expect(express).toBeDefined();
  });

  test('should verify required dependencies exist', () => {
    expect(() => require('cors')).not.toThrow();
    expect(() => require('helmet')).not.toThrow();
    expect(() => require('morgan')).not.toThrow();
    expect(() => require('dotenv')).not.toThrow();
  });

  test('should verify project structure', () => {
    const fs = require('fs');
    const path = require('path');
    
    // Verificar que los directorios principales existen
    expect(fs.existsSync(path.join(__dirname, '../app.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../routes'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../models'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../database'))).toBe(true);
  });
});
