const { LOGIN, SELECTOR } = require('./config');
const logger = require('./utils/logger');

// Performs optional login if the login form is present and env credentials are set.
async function loginIfNeeded(page) {
  try {
    const isLogin = await page.evaluate(() => {
      const form = document.querySelector('form[action="login.php"]');
      return !!form;
    });

    if (!isLogin || !LOGIN?.enabled || !LOGIN?.username || !LOGIN?.password) return;

    // Read current (autocompleted) values from the form
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

    // Select airport only if it differs from the configured one
    const targetAer = LOGIN.aeropuerto || 'MTY';
    if (existing.aer !== targetAer) {
      await page.select('select[name="aeropuerto"]', targetAer);
    }

    // Type username only if the field is empty
    if (!existing.user) {
      await page.focus('input[name="user_name"]');
      await page.keyboard.type(LOGIN.username, { delay: 50 });
    }

    // Type password only if the field is empty
    if (!existing.pass) {
      await page.focus('input[name="user_password"]');
      await page.keyboard.type(LOGIN.password, { delay: 50 });
    }

    // Submit the form and wait for navigation
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    await page.waitForSelector(SELECTOR, { timeout: 15000 }).catch(() => {});
    logger.info('Automatic login completed.');
  } catch (err) {
    logger.error('Automatic login error:', err.message);
  }
}

module.exports = { loginIfNeeded };
