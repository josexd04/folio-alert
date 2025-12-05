// Browser factory: centralizes Puppeteer launch configuration.
const puppeteer = require('puppeteer');
const { CHROME_PATH, USER_DATA_DIR, HEADLESS } = require('./config');

async function launchBrowser() {
  return await puppeteer.launch({
    headless: HEADLESS,
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    args: ['--start-maximized'],
    defaultViewport: null
  });
}

module.exports = { launchBrowser };