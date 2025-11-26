// ui-tests/tests/create-patient-spa.spec.ts
import { test, expect } from '@playwright/test';
import { loginSpaWithLocation } from './helpers';

// (Opcional) subir timeout de este test 
test.setTimeout(120_000);

test('Crear paciente en SPA y verificar que se muestra su ficha', async ({ page }) => {
  // 1) Login + selección de location → termina en /spa/home
  await loginSpaWithLocation(page);

  // 2) Ir directamente a la pantalla de Patient Registration (SPA)
  await page.goto('http://localhost/openmrs/spa/patient-registration', {
    waitUntil: 'networkidle',
  });

  // Asegurarnos que el formulario de registro está cargado
  await page.getByText('1. Basic Info', { exact: false }).waitFor();

  // 3) BASIC INFO
  const randomSuffix = Math.random().toString(36).substring(2, 7); // ej: "kqzpf"
  const givenName = `TestName${randomSuffix}`;
  const familyName = `TestLast${randomSuffix}`;

  // --- Patient's Name is Known? -> Yes ---
  await page.getByRole('tab', { name: /yes/i }).first().click();

  // --- First Name / Family Name ---
  await page.getByRole('textbox', { name: /first name/i }).fill(givenName);
  await page.getByRole('textbox', { name: /family name/i }).fill(familyName);

  // --- Sex -> Male (campo obligatorio) ---
  await page
    .getByRole('group', { name: /sex/i }) 
    .getByText(/^Male$/i)                 // el texto del label
    .click();

  // (Opcional) verificar que el radio quedó marcado
  await expect(
    page.getByRole('radio', { name: /^Male$/i }),
  ).toBeChecked();

  // --- Birth: Date of Birth Known? -> Yes ---
  const yesTabs = page.getByRole('tab', { name: /yes/i });
  const yesCount = await yesTabs.count();
  if (yesCount > 1) {
    await yesTabs.nth(1).click();
  } else {
    await yesTabs.first().click();
  }

  // --- Fecha de nacimiento (dd/mm/yyyy) ---
  const daySpin = page.getByRole('spinbutton', { name: /day/i });
  const monthSpin = page.getByRole('spinbutton', { name: /month/i });
  const yearSpin = page.getByRole('spinbutton', { name: /year/i });

  await daySpin.fill('01');
  await monthSpin.fill('01');
  await yearSpin.fill('1990');

  // --- Identifiers ---
  // OpenMRS ID es auto-generated → no tocamos nada.

  // 4) Click en "Register patient"
  await page.getByRole('button', { name: /register patient/i }).click();

  // En caso exista modal de confirmacion
  const confirmButton = page.getByRole('button', { name: /confirm/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // 5) Verificar que estamos en la ficha del paciente recién creado
  await page.waitForURL(/\/spa\/patient\/.+\/chart/, { timeout: 60_000 });

  await expect(page.locator('body')).toContainText(givenName);
  await expect(page.locator('body')).toContainText(familyName);
});
