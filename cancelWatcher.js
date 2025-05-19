const { showCancelFolio } = require('./notifier');
const { SELECTOR } = require('./config');

let prevCanceledFolios = [];

async function checkCanceledTickets(page) {
  const canceledFolios = await page.evaluate((selector) => {
    const rows = Array.from(document.querySelectorAll(selector));
    return rows
      .map(row => {
        const cells = row.querySelectorAll('td');
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
}

module.exports = { checkCanceledTickets };