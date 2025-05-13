const { SELECTOR } = require('./config');

async function scrapeFolios(page) {
  return await page.evaluate((selector) => {
    const rows = Array.from(document.querySelectorAll(selector));
    const data = [];

    for (const row of rows) {
      const folio = row.cells[0]?.textContent.trim();        // NÚM
      const boleto = row.cells[1]?.textContent.trim();       // BOLETO
      const tipo = row.cells[6]?.textContent.trim();     // tipo
      const terminal = row.cells[7]?.textContent.trim() // terminal

      if (folio && boleto) {
        data.push({
          folio,
          ultimos3: boleto.slice(-3),
          tipo, 
          terminal
        });
      }
    }

    return data;
  }, SELECTOR);
}

module.exports = scrapeFolios;