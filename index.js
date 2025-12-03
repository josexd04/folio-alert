const { launchBrowser } = require('./browser');
const { URL, CHECK_INTERVAL } = require('./config');
const { loginIfNeeded } = require('./login');
const { checkForUpdatesAcrossPages } = require('./foliosMonitor');
const { checkCanceledTickets } = require('./cancelWatcher');

async function monitorPage() {
  console.log('Iniciando monitoreo de folios...');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  page.on('close', () => {
    console.log('Pestaña cerrada, saliendo.');
    process.exit();
  });

  browser.on('disconnected', () => {
    console.log('Navegador cerrado, saliendo.');
    process.exit();
  });

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
    console.error('Error cargando página:', e);
    await browser.close();
    return;
  }

  console.log('Monitoreando cambios...');

  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      if (page.isClosed()) throw new Error('Página cerrada.');
      await checkForUpdatesAcrossPages(browser);
      await checkCanceledTickets(page);
    } catch (err) {
      console.error('Error en monitoreo:', err.message);
    } finally {
      running = false;
    }
  }, CHECK_INTERVAL);
}

monitorPage().catch(err => console.error('Error fatal:', err));
