import { test, expect } from '@playwright/test';
import { loginLegacy } from './helpers';

test('Login en Legacy UI', async ({ page }) => {
  await loginLegacy(page);

  // validar que estamos en alguna pantalla interna
  await expect(page.locator('body')).toContainText(/OpenMRS/i);
});
