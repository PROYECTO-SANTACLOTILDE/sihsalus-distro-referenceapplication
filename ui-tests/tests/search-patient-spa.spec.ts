import { test, expect } from '@playwright/test';
import {
  loginSpaWithLocation,
  createPatientInSpa,
  ensureOfflinePatientListExists,
} from './helpers';

// El flujo completo (login + lista + registrar + buscar + añadir a lista + visita) es largo
test.setTimeout(150_000);

test('Creación y búsqueda de paciente + lista + visita completa', async ({ page }) => {
  // 1) Login + selección de location → /spa/home
  await loginSpaWithLocation(page);

  // 2) Asegurarnos de que existe la lista "Pacientes offline"
  await ensureOfflinePatientListExists(page, {
    listName: 'Pacientes offline',
    description: 'Lista de pacientes atendidos en modo offline.',
  });

  // 3) Crear paciente en SPA reutilizando el helper
  const { givenName, familyName } = await createPatientInSpa(page, {
    givenPrefix: 'SearchTestName',
    familyPrefix: 'SearchTestLast',
  });

  const searchTerm = givenName;

  // 4) Volver al home SPA
  await page.goto('http://localhost/openmrs/spa/home', {
    waitUntil: 'networkidle',
  });
  await expect(page).toHaveURL(/\/spa\/home/, { timeout: 30_000 });

  // 5) Abrir el buscador de pacientes desde el header
  const searchIcon = page.getByTestId('searchPatientIcon');
  await expect(searchIcon).toBeVisible();
  await searchIcon.click();

  // 6) Campo de búsqueda de pacientes 
  const searchInput = page.getByTestId('patientSearchBar');
  await expect(searchInput).toBeVisible();

  // 7) Buscar por el nombre que acabamos de registrar
  await searchInput.fill(searchTerm);
  await searchInput.press('Enter');

  // Esperar que en los resultados aparezca el nombre
  await expect(page.locator('body')).toContainText(givenName);

  // 8) Hacer click en el resultado que contiene el nombre
  await page.getByText(givenName, { exact: false }).first().click();

  // 9) Validar que estamos otra vez en la ficha clínica del paciente
  await page.waitForURL(/\/spa\/patient\/.+\/chart/, { timeout: 60_000 });
  await expect(page.locator('body')).toContainText(givenName);
  await expect(page.locator('body')).toContainText(familyName);

  // ============================
  // 10) Añadir el paciente a la lista "Pacientes offline"
  // ============================

  // 10.1) Abrir el menú "Actions" del patient banner
  const patientBanner = page.getByRole('banner', { name: /patient banner/i });
  await expect(patientBanner).toBeVisible();

  await patientBanner
    .getByRole('button', { name: /^Actions$/i })
    .click();

  // 10.2) Click en "Add to list"
  await page.getByRole('menuitem', { name: /Add to list/i }).click();

  // 10.3) En el modal "Add patient to list", buscar la lista y seleccionarla

  const modalTitle = page.getByRole('heading', { name: /Add patient to list/i });
  await expect(modalTitle).toBeVisible();

  // Campo de búsqueda de listas
  const listSearchInput = page.getByRole('searchbox', {
    name: /Search for a list/i,
  });
  await expect(listSearchInput).toBeVisible();

  await listSearchInput.fill('Pacientes offline');

  // Esperar a que aparezca la opción "Pacientes offline"
  const offlineLabel = page.getByText('Pacientes offline', { exact: true });
  await expect(offlineLabel).toBeVisible();

  // Click en el label 
  await offlineLabel.click();

  // Verificar que el checkbox quedó marcado
  await expect(
    page.getByRole('checkbox', { name: /Pacientes offline/i }),
  ).toBeChecked();

  // 10.4) Click en "Add to list"
  await page.getByRole('button', { name: /^Add to list$/i }).click();

  // 10.5) Verificar que el modal se cierra
  await expect(modalTitle).not.toBeVisible({ timeout: 10_000 });

  // ============================
  // 11) Iniciar una visita de tipo "Offline Visit"
  // ============================

  // 11.1) Botón "Start a visit" en el header del patient chart
  const startVisitHeaderButton = page.getByRole('button', {
    name: /^Start a visit$/i,
  });
  await expect(startVisitHeaderButton).toBeVisible();
  await startVisitHeaderButton.click();

  // 11.2) Esperar a que cargue el workspace de visita
  const visitTypeSectionTitle = page.getByText('Visit Type', { exact: true });
  await expect(visitTypeSectionTitle).toBeVisible();

  // 11.3) Seleccionar "Offline Visit" como tipo de visita
  const offlineVisitLabel = page.getByText('Offline Visit', { exact: true });
  await expect(offlineVisitLabel).toBeVisible();
  await offlineVisitLabel.click();

  // Comprobar que el radio quedó marcado
  await expect(
    page.getByRole('radio', { name: /Offline Visit/i }),
  ).toBeChecked();

  // 11.4) Click en el botón "Start visit" del formulario
  await page.getByRole('button', { name: /^Start visit$/i }).click();

  // 11.5) Esperar a que el chart muestre la visita activa (botón "End visit")
  const endVisitButton = page.getByRole('button', { name: /^End visit$/i });
  await expect(endVisitButton).toBeVisible({ timeout: 30_000 });

    // ============================
  // 12) Finalizar la visita
  // ============================

  // Simular que la visita dura un tiempo 
  await page.waitForTimeout(10_000);

  // 12.1) Click en "End visit" en el header
  await endVisitButton.click();

  // 12.2) Esperar el modal de confirmación
  const endVisitDialog = page
    .getByRole('dialog')
    .filter({
      hasText: 'Are you sure you want to end this active visit?',
    });

  await expect(endVisitDialog).toBeVisible({ timeout: 10_000 });

  // Botón "End Visit" dentro del modal
  const endVisitConfirmButton = endVisitDialog.getByRole('button', {
    name: /End Visit/i, 
  });

  await endVisitConfirmButton.click();

  // 12.3) Verificar que el modal se cierra
  await expect(endVisitDialog).not.toBeVisible({ timeout: 10_000 });

  // 12.4) Verificar que vuelve a aparecer "Start a visit" (visita finalizada)
  await expect(
    page.getByRole('button', { name: /^Start a visit$/i }),
  ).toBeVisible({ timeout: 30_000 });

});
