const { launchBrowser } = require('./browser');
const { URL, CHECK_INTERVAL, LOGIN } = require('./config');
const { loginIfNeeded } = require('./login');
const { checkForUpdatesAcrossPages } = require('./foliosMonitor');
const { checkCanceledTickets } = require('./cancelWatcher');
const logger = require('./utils/logger');

// Entry point: launches browser, performs login and starts the monitoring loop.
async function monitorPage() {
  logger.info('Starting folio monitoring...');
  if (LOGIN.enabled && LOGIN.username) {
    logger.info(`Login enabled for user: ${LOGIN.username}`);
  }

  const browser = await launchBrowser();
  const page = await browser.newPage();

  // Lifecycle hooks: exit the process when the tab or browser closes
  page.on('close', () => {
    logger.info('Tab closed, exiting.');
    process.exit();
  });

  browser.on('disconnected', () => {
    logger.info('Browser disconnected, exiting.');
    process.exit();
  });

  // Graceful shutdown on OS signals
  process.on('SIGINT', async () => {
    try { await browser.close(); } catch (_) {}
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    try { await browser.close(); } catch (_) {}
    process.exit(0);
  });

  try {
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await loginIfNeeded(page);
  } catch (e) {
    logger.error('Error loading page:', e.message);
    await browser.close();
    return;
  }

  logger.info('Monitoring for changes...');

  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      if (page.isClosed()) throw new Error('Page closed.');
      await checkForUpdatesAcrossPages(browser);
      await checkCanceledTickets(page);
    } catch (err) {
      logger.error('Monitoring error:', err.message);
    } finally {
      running = false;
    }
  }, CHECK_INTERVAL);
}

monitorPage().catch(err => logger.error('Fatal error:', err));
