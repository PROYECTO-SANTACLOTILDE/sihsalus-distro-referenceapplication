// import { test, expect } from '@playwright/test';

// test('login en Legacy UI y llega al home', async ({ page }) => {
//   // Navega a la página de login (baseURL = http://localhost/openmrs)
//   await page.goto('http://localhost/openmrs/login.htm', { waitUntil: 'networkidle' });
//   await page.waitForSelector('#username', { timeout: 60000 });

//   // Completar usuario y contraseña usando los IDs correctos
//   await page.fill('#username', 'admin');    // id="username"
//   await page.fill('#password', 'Admin123'); // id="password"

//   // Click en el botón de login (input submit con value "Iniciar sesión")
//   await page.getByRole('button', { name: 'Log In' }).click();
//   // Alternativa equivalente:
//   // await page.click('button:has-text("Log In")');

//   // Esperar que salgamos de la página de login
//   await expect(page).not.toHaveURL(/\/login\.htm$/);

//   //validar que estamos en alguna pantalla interna
//   await expect(page.locator('body')).toContainText('OpenMRS');
// });
import { test, expect } from '@playwright/test';
import { loginLegacy } from './helpers';

test('login en Legacy UI y llega al home', async ({ page }) => {
  await loginLegacy(page);

  // validar que estamos en alguna pantalla interna
  await expect(page.locator('body')).toContainText(/OpenMRS/i);
});
