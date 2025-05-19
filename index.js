const puppeteer = require('puppeteer');
const scrapeFolios = require('./scraper');
const { showNotification } = require('./notifier');
const { checkCanceledTickets } = require('./cancelWatcher');
const { URL, CHECK_INTERVAL, CHROME_PATH, USER_DATA_DIR } = require('./config');

let lastFolios = [];

async function checkForUpdates(page) {
  const foliosData = await scrapeFolios(page);
  const currentFolios = foliosData.map(f => f.folio);

  if (lastFolios.length) {
    const nuevos = foliosData.filter(f =>
      !lastFolios.includes(f.folio) && f.color !== 'yellow'
    );

    if (nuevos.length) {
      nuevos.forEach(f => {
        const msg = `Num: ${f.folio} | Terminación: ${f.ultimos3} | Tipo: ${f.tipo}, Terminal: ${f.terminal}`;
        console.log('¡Nuevo folio detectado!', msg);
        showNotification(msg);
      });
    }
  }

  lastFolios = currentFolios;
}

async function monitorPage() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: CHROME_PATH,
    userDataDir: USER_DATA_DIR,
    args: ['--start-maximized'],
    defaultViewport: null
  });

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
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch (e) {
    console.error('Error cargando página:', e);
    return await browser.close();
  }

  console.log('Monitoreando cambios...');

  setInterval(async () => {
    try {
      if (page.isClosed()) throw new Error('Página cerrada.');
      await checkForUpdates(page);
      await checkCanceledTickets(page);
    } catch (err) {
      console.error('Error en monitoreo:', err.message);
    }
  }, CHECK_INTERVAL);
}

monitorPage().catch(err => console.error('Error fatal:', err));