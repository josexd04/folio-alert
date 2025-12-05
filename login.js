const { LOGIN, SELECTOR } = require('./config');

// Performs optional login if the login form is present and env credentials are set.
async function loginIfNeeded(page) {
  try {
    const isLogin = await page.evaluate(() => {
      const form = document.querySelector('form[action="login.php"]');
      return !!form;
    });

    if (!isLogin || !LOGIN?.enabled || !LOGIN?.username || !LOGIN?.password) return;

    // Leer valores actuales (autocompletados) del formulario
    const existing = await page.evaluate(() => {
      const aerEl = document.querySelector('select[name="aeropuerto"]');
      const userEl = document.querySelector('input[name="user_name"]');
      const passEl = document.querySelector('input[name="user_password"]');
      return {
        aer: (aerEl?.value || '').trim(),
        user: (userEl?.value || '').trim(),
        pass: (passEl?.value || '').trim()
      };
    });

    // Seleccionar aeropuerto solo si no está en MTY (o el configurado)
    const targetAer = LOGIN.aeropuerto || 'MTY';
    if (existing.aer !== targetAer) {
      await page.select('select[name="aeropuerto"]', targetAer);
    }

    // Escribir usuario solo si está vacío
    if (!existing.user) {
      await page.focus('input[name="user_name"]');
      await page.keyboard.type(LOGIN.username, { delay: 50 });
    }

    // Escribir contraseña solo si está vacía
    if (!existing.pass) {
      await page.focus('input[name="user_password"]');
      await page.keyboard.type(LOGIN.password, { delay: 50 });
    }

    // Enviar formulario y esperar navegación
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    await page.waitForSelector(SELECTOR, { timeout: 15000 }).catch(() => {});
    console.log('Login automático completado.');
  } catch (err) {
    console.error('Error en login automático:', err.message);
  }
}

module.exports = { loginIfNeeded };
