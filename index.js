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

  try {
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await loginIfNeeded(page);
  } catch (e) {
    console.error('Error cargando página:', e);
    await browser.close();
    return;
  }

  console.log('Monitoreando cambios...');

  setInterval(async () => {
    try {
      if (page.isClosed()) throw new Error('Página cerrada.');
      await checkForUpdatesAcrossPages(browser);
      await checkCanceledTickets(page);
    } catch (err) {
      console.error('Error en monitoreo:', err.message);
    }
  }, CHECK_INTERVAL);
}

monitorPage().catch(err => console.error('Error fatal:', err));
