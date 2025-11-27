require('dotenv').config();
module.exports = {
  URL: process.env.APP_URL || 'https://eboletos.vunicamovil.com/index.php',
  SELECTOR: '#BoletosVendidos table tbody tr',
  CHECK_INTERVAL: Number(process.env.CHECK_INTERVAL_MS) || 3000,
  CHROME_PATH: process.env.CHROME_PATH || (process.env.LOCALAPPDATA + '/Google/Chrome SxS/Application/chrome.exe'),
  USER_DATA_DIR: process.env.USER_DATA_DIR || './user-data-dir',
  LOGIN: {
    enabled: process.env.LOGIN_ENABLED ? process.env.LOGIN_ENABLED === 'true' : true,
    aeropuerto: process.env.LOGIN_AEROPUERTO || 'MTY',
    username: process.env.LOGIN_USERNAME,
    password: process.env.LOGIN_PASSWORD
  }
};
