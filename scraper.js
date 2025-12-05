// Scrapes the folio table and returns normalized records.
// Columns mapping:
// 0: folio (span color), 1: boleto, 5: zona, 6: tipo, 7: terminal, 8: estado
const { SELECTOR } = require('./config');

async function scrapeFolios(page) {
  await page.waitForSelector(SELECTOR, { timeout: 15000 }).catch(() => {});
  return await page.evaluate((selector) => {
    const rows = Array.from(document.querySelectorAll(selector));
    const data = [];

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      const folioCell = cells[0];
      const span = folioCell?.querySelector('span');
      const color = span?.style?.color?.toLowerCase() || '';

      const folio = folioCell?.innerText.trim();
      const boleto = cells[1]?.textContent.trim();
      const tipo = cells[6]?.textContent.trim();
      const terminal = cells[7]?.textContent.trim();
      const zona = cells[5]?.textContent.trim();
      const estado = (cells[8]?.textContent || '').trim().toUpperCase();

      if (folio && boleto) {
        data.push({
          folio,
          ultimos3: boleto.slice(-3),
          tipo,
          terminal,
          zona,
          estado,
          color
        });
      }
    }

    return data;
  }, SELECTOR);
}

module.exports = scrapeFolios;