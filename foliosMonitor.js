// Monitors all open pages, aggregates folio data and emits notifications.
// Only notifies when a folio appears for the first time in the session.
const scrapeFolios = require('./scraper');
const { showNotification, showCambio, showVentaEspecial } = require('./notifier');
const messages = require('./utils/messages');
const { URL } = require('./config');
const logger = require('./utils/logger');

// Seen folios across checks (to detect new ones)
let lastFoliosAll = new Set();
// Deduplication sets for special categories
let notifiedCambio = new Set();
let notifiedVentaEspecial = new Set();

function zonaUpper(info) {
  return (info.zona || '').toUpperCase();
}
function isCambio(info) {
  return zonaUpper(info).includes('CAMBIO');
}
function isVentaEspecial(info) {
  return zonaUpper(info).includes('VENTA ESPECIAL');
}
function isCanceled(info) {
  return (info.estado || '').toUpperCase() === 'CANCE';
}
function isYellow(info) {
  return info.color === 'yellow';
}
function isNormal(info) {
  return !isYellow(info) && !isCambio(info) && !isVentaEspecial(info) && !isCanceled(info);
}

// Checks every open browser page that matches the target URL for new folios
async function checkForUpdatesAcrossPages(browser) {
  // Get all open pages and keep only those whose base URL matches our target
  const pages = await browser.pages();
  const matchingPages = pages.filter(page => {
    const baseUrl = page.url().split('#')[0];
    return baseUrl === URL;
  });

  // Map to store complete info for each folio (key: folio number)
  const folioInfoByFolio = new Map();
  // Set to collect all current folio numbers
  const currentFoliosSet = new Set();

  // Scrape folios from each matching page
  for (const page of matchingPages) {
    try {
      const foliosData = await scrapeFolios(page);
      for (const folioData of foliosData) {
        currentFoliosSet.add(folioData.folio);
        // Store the first occurrence of each folio
        if (!folioInfoByFolio.has(folioData.folio)) {
          folioInfoByFolio.set(folioData.folio, folioData);
        }
      }
    } catch (error) {
      // Silently ignore scraping errors for individual pages
    }
  }

  // Compare with previous check to find new folios
  if (lastFoliosAll.size > 0) {
    const newFolios = Array.from(currentFoliosSet)
      .filter(folio => !lastFoliosAll.has(folio))
      .map(folio => folioInfoByFolio.get(folio))
      .filter(info => info && isNormal(info));

    newFolios.forEach(info => {
      const message = messages.normal(info);
      logger.info('New folio detected!', message);
      showNotification(message);
    });

    const newSpecialFolios = Array.from(currentFoliosSet)
      .filter(folio => !lastFoliosAll.has(folio))
      .map(folio => folioInfoByFolio.get(folio))
      .filter(info => info && (isCambio(info) || isVentaEspecial(info)));

    newSpecialFolios.forEach(info => {
      if (isCambio(info) && !notifiedCambio.has(info.folio)) {
        showCambio(messages.cambio(info));
        notifiedCambio.add(info.folio);
      }
      if (isVentaEspecial(info) && !notifiedVentaEspecial.has(info.folio)) {
        showVentaEspecial(messages.ventaEspecial(info));
        notifiedVentaEspecial.add(info.folio);
      }
    });
  }

  // Update the reference set for the next check
  lastFoliosAll = currentFoliosSet;
}

module.exports = { checkForUpdatesAcrossPages };
