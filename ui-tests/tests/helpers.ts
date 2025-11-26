import { Page, expect } from '@playwright/test';

export async function loginLegacy(page: Page) {
    // Navega a la página de login (baseURL = http://localhost/openmrs)
    await page.goto('http://localhost/openmrs/login.htm', { waitUntil: 'networkidle' });
    await page.waitForSelector('#username', { timeout: 60000 });
    
    // Completar usuario y contraseña usando los IDs correctos
    await page.fill('#username', 'admin');
    await page.fill('#password', 'Admin123');

    // Click en el botón de login (input submit con value "Iniciar sesión")
    await page.getByRole('button', { name: /log in/i }).click();

    // Asegura que ya no estás en login
    await expect(page).not.toHaveURL(/\/login\.htm$/);
}

/**
 * Login en Legacy + selección de location en SPA.
 * Deja la sesión en http://localhost/openmrs/spa/home.
 */
export async function loginSpaWithLocation(page: Page) {
  // 1) Login clásico
  await loginLegacy(page);

  // 2) Ir a SPA → redirige a /spa/login/location
  await page.goto('http://localhost/openmrs/spa', { waitUntil: 'networkidle' });

  // Esperar el texto de la pantalla de location
  await page
    .getByText('Select your location from the list below', { exact: false })
    .waitFor();

  // 3) Elegir un location (Outpatient Clinic si existe; si no, el primero)
  const outpatientRadio = page.getByRole('radio', { name: /Outpatient Clinic/i });

  if (await outpatientRadio.count()) {
    // El label está encima del input → usamos force:true para ignorar el overlay
    await outpatientRadio.first().check({ force: true });
  } else {
    // Fallback: primer radio disponible
    await page.getByRole('radio').first().check({ force: true });
  }

  // 4) Confirmar (se habilita después de seleccionar location)
  const confirmBtn = page.getByRole('button', { name: /confirm/i });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  // 5) Esperar a que cargue el home de SPA
  await page.waitForURL(/\/spa\/home/, { timeout: 60000 });
}