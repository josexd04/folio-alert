// Monitors all open pages, aggregates folio data and emits notifications.
// Only notifies when a folio appears for the first time in the session.
const scrapeFolios = require('./scraper');
const { showNotification, showCambio, showVentaEspecial, playTerminalAudio } = require('./notifier');
const { enviarBoleto } = require('./google');
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
      logger.info(`Folio data -> folio: ${info.folio}, zona: "${info.zona}", terminal: "${info.terminal}", tipo: ${info.tipo}, color: ${info.color}, estado: ${info.estado}`);
      showNotification(message);
      logger.info(`Playing terminal audio for "${info.terminal}"`);
      playTerminalAudio(info.terminal);
      enviarBoleto(info.boleto, info.zona, 'Normal', info.terminal);
    });

    const newSpecialFolios = Array.from(currentFoliosSet)
      .filter(folio => !lastFoliosAll.has(folio))
      .map(folio => folioInfoByFolio.get(folio))
      .filter(info => info && (isCambio(info) || isVentaEspecial(info)));

    newSpecialFolios.forEach(info => {
      logger.info(`Special folio data -> folio: ${info.folio}, zona: "${info.zona}", terminal: "${info.terminal}", tipo: ${info.tipo}`);
      if (isCambio(info) && !notifiedCambio.has(info.folio)) {
        showCambio(messages.cambio(info));
        logger.info(`Playing terminal audio for "${info.terminal}"`);
        playTerminalAudio(info.terminal);
        notifiedCambio.add(info.folio);
        enviarBoleto(info.boleto, info.zona, 'Cambio', info.terminal);
      }
      if (isVentaEspecial(info) && !notifiedVentaEspecial.has(info.folio)) {
        showVentaEspecial(messages.ventaEspecial(info));
        logger.info(`Playing terminal audio for "${info.terminal}"`);
        playTerminalAudio(info.terminal);
        notifiedVentaEspecial.add(info.folio);
        enviarBoleto(info.boleto, info.zona, 'Venta Especial', info.terminal);
      }
    });
  }

  // Update the reference set for the next check
  lastFoliosAll = currentFoliosSet;
}

module.exports = { checkForUpdatesAcrossPages };
