const { showCancelFolio } = require('./notifier');
const { SELECTOR } = require('./config');

<<<<<<< HEAD
let prevCanceledFolios = [];

async function checkCanceledTickets(page) {
  const canceledFolios = await page.evaluate((selector) => {
=======
let prevStates = new Map();

async function checkCanceledTickets(page) {
  const folios = await page.evaluate((selector) => {
>>>>>>> 62f1437 (Inicializa repo: modularización, elimina auto-refresh y corrige duplicados)
    const rows = Array.from(document.querySelectorAll(selector));
    return rows
      .map(row => {
        const cells = row.querySelectorAll('td');
<<<<<<< HEAD
        const boleto = cells[1]?.textContent.trim();
        const estado = cells[8]?.textContent.trim(); // ESTADO

        return { boleto, estado };
      })
      .filter(f => f.estado === 'CANCE' && f.boleto);
  }, SELECTOR);

  for (const { boleto } of canceledFolios) {
    if (!prevCanceledFolios.includes(boleto)) {
      const ultimos3 = boleto.slice(-3);
      showCancelFolio(`Se ha cancelado el folio terminación ${ultimos3}`);
    }
  }

  prevCanceledFolios = canceledFolios.map(f => f.boleto);
=======
        const boleto = cells[1]?.textContent?.trim() || '';
        const estado = (cells[8]?.textContent || '').trim().toUpperCase(); // ESTADO
        return { boleto, estado };
      })
      .filter(f => f.boleto);
  }, SELECTOR);

  for (const { boleto, estado } of folios) {
    const prev = prevStates.get(boleto);
    if (prev !== undefined && prev === 'VEND' && estado === 'CANCE') {
      const ultimos3 = boleto.slice(-3);
      showCancelFolio(`Se ha cancelado el folio terminación ${ultimos3}`);
    }
    // Actualiza siempre el estado (primer ciclo solo registra, no notifica)
    prevStates.set(boleto, estado);
  }
>>>>>>> 62f1437 (Inicializa repo: modularización, elimina auto-refresh y corrige duplicados)
}

module.exports = { checkCanceledTickets };