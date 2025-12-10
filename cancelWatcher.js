// Watches table state transitions and notifies only when a sold folio becomes canceled.
const { showCancelFolio } = require('./notifier');
const messages = require('./utils/messages');
const { SELECTOR } = require('./config');
const cheerio = require('cheerio');

let prevStates = new Map();

async function checkCanceledTickets(page) {
  try {
    const html = await page.content();
    const $ = cheerio.load(html);
    const elements = $(SELECTOR);
    
    const folios = [];
    elements.each((i, row) => {
      const cells = $(row).find('td');
      const boleto = $(cells[1]).text().trim();
      const estado = ($(cells[8]).text() || '').trim().toUpperCase();
      if (boleto) {
        folios.push({ boleto, estado });
      }
    });

    for (const { boleto, estado } of folios) {
      const prev = prevStates.get(boleto);
      const transitionedToCancel = prev !== undefined && prev === 'VEND' && estado === 'CANCE';
      if (transitionedToCancel) {
        const ultimos3 = boleto.slice(-3);
        showCancelFolio(messages.cancel(ultimos3));
      }
      prevStates.set(boleto, estado);
    }
  } catch (error) {
    console.error('Error checking canceled tickets:', error.message);
  }
}

module.exports = { checkCanceledTickets };
