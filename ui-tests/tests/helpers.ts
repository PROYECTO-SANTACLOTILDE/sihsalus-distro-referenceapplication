import { Page, expect } from '@playwright/test';

export async function loginLegacy(page: Page) {
    // Navega a la página de login (baseURL = http://localhost/openmrs)
    await page.goto('http://localhost/openmrs/login.htm', { waitUntil: 'networkidle' });
    await page.waitForSelector('#username', { timeout: 60000 });
    
    // Completar usuario y contraseña 
    await page.fill('#username', 'admin');
    await page.fill('#password', 'Admin123');

    // Click en el botón de login 
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
    await outpatientRadio.first().check({ force: true });
  } else {
    // Fallback: primer radio disponible
    await page.getByRole('radio').first().check({ force: true });
  }

  // 4) Confirmar 
  const confirmBtn = page.getByRole('button', { name: /confirm/i });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  // 5) Esperar el home de SPA
  await page.waitForURL(/\/spa\/home/, { timeout: 60000 });
}

/**
 * Crea un paciente en la pantalla SPA de "Patient Registration"
 * y devuelve el nombre y apellido usados.
 *
 * Requiere:
 *   - que ya estés logueado
 *   - y con location seleccionado.
 */
export async function createPatientInSpa(
  page: Page,
  opts?: { givenPrefix?: string; familyPrefix?: string },
): Promise<{ givenName: string; familyName: string }> {
  const givenPrefix = opts?.givenPrefix ?? 'TestName';
  const familyPrefix = opts?.familyPrefix ?? 'TestLast';

  // 1) Ir a la pantalla de Patient Registration (SPA)
  await page.goto('http://localhost/openmrs/spa/patient-registration', {
    waitUntil: 'networkidle',
  });

  // Asegurarnos que el formulario de registro está cargado
  await page.getByText('1. Basic Info', { exact: false }).waitFor();

  // 2) BASIC INFO
  const randomSuffix = Math.random().toString(36).substring(2, 7); // ej: "kqzpf"
  const givenName = `${givenPrefix}${randomSuffix}`;
  const familyName = `${familyPrefix}${randomSuffix}`;

  // --- Patient's Name is Known? -> Yes ---
  await page.getByRole('tab', { name: /yes/i }).first().click();

  // --- First Name / Family Name ---
  await page.getByRole('textbox', { name: /first name/i }).fill(givenName);
  await page.getByRole('textbox', { name: /family name/i }).fill(familyName);

  // --- Sex -> Male (campo obligatorio) ---
  await page
    .getByRole('group', { name: /sex/i })
    .getByText(/^Male$/i)
    .click();

  // Verificar que el radio quedó marcado
  await expect(page.getByRole('radio', { name: /^Male$/i })).toBeChecked();

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

  // 3) Registrar paciente
  await page.getByRole('button', { name: /register patient/i }).click();

  // En caso exista modal de confirmación
  const confirmButton = page.getByRole('button', { name: /confirm/i });
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  // 4) Verificar que estamos en la ficha del paciente recién creado
  await page.waitForURL(/\/spa\/patient\/.+\/chart/, { timeout: 60_000 });

  await expect(page.locator('body')).toContainText(givenName);
  await expect(page.locator('body')).toContainText(familyName);

  return { givenName, familyName };
}

/**
 * Crea (si no existe) una lista de pacientes con el nombre dado.
 * Deja la sesión en la pantalla de listas de pacientes.
 */
export async function ensureOfflinePatientListExists(
  page: Page,
  opts: { listName: string; description: string },
) {
  const { listName, description } = opts;

  // 1) Ir a la pantalla de Patient lists
  await page.goto('http://localhost/openmrs/spa/home/patient-lists', {
    waitUntil: 'networkidle',
  });

  // 2) Asegurar que estamos en la pestaña "All lists"
  const allListsTab = page.getByRole('tab', { name: /All lists/i });
  await expect(allListsTab).toBeVisible();

  const isSelected = await allListsTab.getAttribute('aria-selected');
  if (isSelected !== 'true') {
    await allListsTab.click();
  }

    // Función helper interna para buscar una lista por nombre en la tabla
  async function findListRowByName() {
    // Área de búsqueda "Search this list"
    const searchRegion = page.getByRole('search', {
      name: /Search this list/i,
    });

    // Si todavía no existe la región de search (empty state: "There are no patient lists to display"),
    // devolvemos un locator de fila que NO será visible, para que el caller sepa que no existe la lista.
    const regionCount = await searchRegion.count();
    if (regionCount === 0) {
      return page.getByRole('row', { name: new RegExp(listName, 'i') });
    }

    const searchInput = searchRegion.getByRole('searchbox');

    // Si por alguna razón el input aún no es visible, no cae el test aquí;
    // simplemente devolvemos el locator de fila.
    if (!(await searchInput.isVisible().catch(() => false))) {
      return page.getByRole('row', { name: new RegExp(listName, 'i') });
    }

    // Limpiamos y buscamos por el nombre de la lista
    await searchInput.fill(listName);
    await searchInput.press('Enter').catch(() => {});

    // Delay para que se actualice la tabla
    await page.waitForTimeout(1000);

    // Fila que contenga el nombre de la lista
    return page.getByRole('row', { name: new RegExp(listName, 'i') });
  }


  // 3) Si la lista ya existe, no hacemos nada
  let listRow = await findListRowByName();
  if (await listRow.isVisible().catch(() => false)) {
    return; //Lista encontrada, salimos sin crear nada
  }

  // 4) Si NO existe, la creamos
  await page.getByRole('button', { name: /^New list$/i }).click();

  // Encabezado del overlay "New patient list"
  const overlayHeader = page.getByText('New patient list', { exact: false });
  await expect(overlayHeader).toBeVisible();

  // Inputs de nombre y descripción
  const nameInput = page.getByRole('textbox', { name: /List name/i });
  const descInput = page.getByRole('textbox', {
    name: /Describe the purpose of this list in a few words/i,
  });

  await nameInput.fill(listName);
  await descInput.fill(description);

  // Click en "Create list"
  await page.getByRole('button', { name: /^Create list$/i }).click();

  // Esperar a que el overlay se cierre
  await expect(overlayHeader).not.toBeVisible({ timeout: 10_000 });

  // 5) Volver a buscar la lista y verificar que exista ahora
  listRow = await findListRowByName();
  await expect(listRow).toBeVisible({ timeout: 10_000 });
}
