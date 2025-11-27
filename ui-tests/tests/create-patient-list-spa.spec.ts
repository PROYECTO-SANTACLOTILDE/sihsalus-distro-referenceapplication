import { test, expect } from '@playwright/test';
import { loginSpaWithLocation, ensureOfflinePatientListExists } from './helpers';

test.setTimeout(60_000);

test('Crear lista de pacientes "Pacientes offline"', async ({ page }) => {
  // 1) Login + location
  await loginSpaWithLocation(page);

  // 2) Asegurar que la lista existe (si no existe, la crea)
  await ensureOfflinePatientListExists(page, {
    listName: 'Pacientes offline',
    description: 'Lista de pacientes atendidos en modo offline.',
  });

  // 3) Verificación simple: la lista se ve en la pantalla
  await expect(page.locator('body')).toContainText('Pacientes offline');
});
