const scrapeFolios = require('./scraper');
const { showNotification } = require('./notifier');
const { URL } = require('./config');

let lastFoliosAll = new Set();

async function checkForUpdatesAcrossPages(browser) {
  const pages = await browser.pages();
  const matchingPages = pages.filter(p => {
    const u = p.url().split('#')[0];
    return u === URL;
  });

  const folioInfoByFolio = new Map();
  const currentFoliosSet = new Set();

  for (const page of matchingPages) {
    const foliosData = await scrapeFolios(page);
    for (const f of foliosData) {
      currentFoliosSet.add(f.folio);
      if (!folioInfoByFolio.has(f.folio)) {
        folioInfoByFolio.set(f.folio, f);
      }
    }
  }

  if (lastFoliosAll.size > 0) {
    const nuevos = [];
    for (const folio of currentFoliosSet) {
      if (!lastFoliosAll.has(folio)) {
        const info = folioInfoByFolio.get(folio);
        if (info && info.color !== 'yellow') {
          nuevos.push(info);
        }
      }
    }

    if (nuevos.length) {
      for (const f of nuevos) {
        const msg = `Num: ${f.folio} | Terminación: ${f.ultimos3} | Tipo: ${f.tipo}, Terminal: ${f.terminal}`;
        console.log('¡Nuevo folio detectado!', msg);
        showNotification(msg);
      }
    }
  }

  lastFoliosAll = currentFoliosSet;
}

module.exports = { checkForUpdatesAcrossPages };