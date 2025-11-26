<<<<<<< HEAD
module.exports = {
  URL: 'https://eboletos.vunicamovil.com/index.php',
  SELECTOR: '#BoletosVendidos table tbody tr',
  CHECK_INTERVAL: 3000,
  CHROME_PATH: 'C:/Users/PC/AppData/Local/Google/Chrome SxS/Application/chrome.exe',
  USER_DATA_DIR: 'C:/Users/PC/AppData/Local/Google/Chrome/User Data/Profile 1'
=======
require('dotenv').config();
module.exports = {
  URL: process.env.APP_URL || 'https://eboletos.vunicamovil.com/index.php',
  SELECTOR: '#BoletosVendidos table tbody tr',
  CHECK_INTERVAL: Number(process.env.CHECK_INTERVAL_MS) || 3000,
  // Ruta para Chrome Canary (Chrome SxS) con detección automática según el usuario actual
  CHROME_PATH: process.env.CHROME_PATH || (process.env.LOCALAPPDATA + '/Google/Chrome SxS/Application/chrome.exe'),
  // Usamos una ruta relativa para el perfil de usuario
  USER_DATA_DIR: process.env.USER_DATA_DIR || './user-data-dir',
  LOGIN: {
    enabled: process.env.LOGIN_ENABLED ? process.env.LOGIN_ENABLED === 'true' : true,
    aeropuerto: process.env.LOGIN_AEROPUERTO || 'MTY',           // Monterrey
    username: process.env.LOGIN_USERNAME || 'monitor.tpa',
    password: process.env.LOGIN_PASSWORD || 'H4c3m0s19'
  }
>>>>>>> 62f1437 (Inicializa repo: modularización, elimina auto-refresh y corrige duplicados)
};