import { test, expect } from '@playwright/test';
import { loginSpaWithLocation, createPatientInSpa } from './helpers';

// Timeout de este test
test.setTimeout(120_000);

test('Crear paciente y verificar ficha', async ({ page }) => {
  // 1) Login + selección de location → termina en /spa/home
  await loginSpaWithLocation(page);

  // 2) Crear paciente usando el helper reutilizable
  const { givenName, familyName } = await createPatientInSpa(page, {
    givenPrefix: 'TestName',
    familyPrefix: 'TestLast',
  });

  // 3)Asserts adicionales específicos de este test
  await expect(page.locator('body')).toContainText(givenName);
  await expect(page.locator('body')).toContainText(familyName);
});
