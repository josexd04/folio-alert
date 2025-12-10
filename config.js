const path = require('path');

// Resolve .env path correctly whether running from source or as a packaged executable
const isPkg = typeof process.pkg !== 'undefined';
const rootDir = isPkg ? path.dirname(process.execPath) : process.cwd();
const envPath = path.resolve(rootDir, '.env');

require('dotenv').config({ path: envPath });

module.exports = {
  URL: process.env.APP_URL || 'https://eboletos.vunicamovil.com/index.php',
  SELECTOR: '#BoletosVendidos table tbody tr',
  CHECK_INTERVAL: Number(process.env.CHECK_INTERVAL_MS) || 3000,
  CHROME_PATH: process.env.CHROME_PATH || (process.env.LOCALAPPDATA + '/Google/Chrome SxS/Application/chrome.exe'),
  // Ensure user-data-dir is created in the same directory as the executable/script
  USER_DATA_DIR: process.env.USER_DATA_DIR ? path.resolve(rootDir, process.env.USER_DATA_DIR) : path.join(rootDir, 'user-data-dir'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  HEADLESS: process.env.HEADLESS === 'true',
  LOGIN: {
    enabled: process.env.LOGIN_ENABLED ? process.env.LOGIN_ENABLED === 'true' : true,
    aeropuerto: process.env.LOGIN_AEROPUERTO || 'MTY',
    username: process.env.LOGIN_USERNAME,
    password: process.env.LOGIN_PASSWORD
  }
};
