const { showCancelFolio } = require('./notifier');
const { SELECTOR } = require('./config');

let prevStates = new Map();

async function checkCanceledTickets(page) {
  const folios = await page.evaluate((selector) => {
    const rows = Array.from(document.querySelectorAll(selector));
    return rows
      .map(row => {
        const cells = row.querySelectorAll('td');
        const boleto = cells[1]?.textContent?.trim() || '';
        const estado = (cells[8]?.textContent || '').trim().toUpperCase();
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
    prevStates.set(boleto, estado);
  }
}

module.exports = { checkCanceledTickets };
