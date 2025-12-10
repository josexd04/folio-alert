const { LOGIN, SELECTOR } = require('./config');
const logger = require('./utils/logger');

// Performs optional login if the login form is present and env credentials are set.
async function loginIfNeeded(page) {
  try {
    logger.info('Checking for login form...');
    // Use evaluateHandle to avoid serialization issues with pkg
    const formHandle = await page.$('form[action="login.php"]');
    const isLogin = !!formHandle;

    if (!isLogin) {
      logger.info('No login form found (or already logged in).');
      return;
    }

    if (!LOGIN?.enabled || !LOGIN?.username || !LOGIN?.password) {
      logger.warn('Login form found but credentials/enabled flag missing in config.');
      return;
    }

    logger.info('Login form detected. Attempting to log in...');

    // Read current (autocompleted) values from the form by selecting elements individually
    let aerVal = '', userVal = '', passVal = '';
    
    try {
      aerVal = await page.$eval('select[name="aeropuerto"]', el => el.value).catch(() => '');
      userVal = await page.$eval('input[name="user_name"]', el => el.value).catch(() => '');
      passVal = await page.$eval('input[name="user_password"]', el => el.value).catch(() => '');
    } catch (readErr) {
       logger.error('Error reading form values via $eval:', readErr.message);
       return;
    }

    const existing = { aer: aerVal.trim(), user: userVal.trim(), pass: passVal.trim() };
    logger.debug('Current form values:', existing);

    // Select airport only if it differs from the configured one
    const targetAer = LOGIN.aeropuerto || 'MTY';
    if (existing.aer !== targetAer) {
      logger.info(`Changing airport from "${existing.aer}" to "${targetAer}"`);
      await page.select('select[name="aeropuerto"]', targetAer);
    }

    // Type username only if the field is empty
    if (!existing.user) {
      logger.info('Filling username...');
      await page.focus('input[name="user_name"]');
      await page.keyboard.type(LOGIN.username, { delay: 50 });
    } else {
      logger.info('Username already filled.');
    }

    // Type password only if the field is empty
    if (!existing.pass) {
      logger.info('Filling password...');
      await page.focus('input[name="user_password"]');
      await page.keyboard.type(LOGIN.password, { delay: 50 });
    } else {
      logger.info('Password already filled.');
    }

    logger.info('Submitting login form...');
    // Submit the form and wait for navigation
    await Promise.all([
      page.click('button[name="login"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
    ]);

    logger.info('Navigation complete. Waiting for dashboard selector...');
    await page.waitForSelector(SELECTOR, { timeout: 15000 }).catch(err => {
      logger.warn('Dashboard selector not found after login (timeout).', err.message);
    });
    
    logger.info('Automatic login sequence finished.');
  } catch (err) {
    logger.error('Automatic login critical error:', err.message);
  }
}

module.exports = { loginIfNeeded };
