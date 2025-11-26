import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  // Reportes y artefactos
  reporter: [
    // Reporter de consola 
    ['list'],
    // Reporter HTML
    ['html', { outputFolder: 'test-results/playwright-report', open: 'never' }],
    // (Opcional) reporte JUnit XML
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
  ],

  // Carpeta donde Playwright guardará screenshots, traces, etc.
  outputDir: 'test-results/artifacts',

  use: {
    // Base URL de tu instancia local 
    baseURL: 'http://localhost/openmrs',
    headless: true,

    // Depuracion
    screenshot: 'only-on-failure',     // Screenshot solo si falla un test
    trace: 'retain-on-failure',        // guarda trace.zip en fallos (muy útil)
  },
});
