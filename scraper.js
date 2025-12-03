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

      if (folio && boleto) {
        data.push({
          folio,
          ultimos3: boleto.slice(-3),
          tipo,
          terminal,
          color
        });
      }
    }

    return data;
  }, SELECTOR);
}

module.exports = scrapeFolios;