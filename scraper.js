// Scrapes the folio table and returns normalized records.
// Columns mapping:
// 0: folio (span color), 1: boleto, 5: zona, 6: tipo, 7: terminal, 8: estado
const { SELECTOR } = require('./config');
const cheerio = require('cheerio');

async function scrapeFolios(page) {
  try {
    await page.waitForSelector(SELECTOR, { timeout: 15000 }).catch(() => {});
    
    // Use cheerio to parse HTML in Node.js context, avoiding pkg serialization issues
    const html = await page.content();
    const $ = cheerio.load(html);
    const elements = $(SELECTOR);
    
    if (elements.length === 0) return [];

    const data = [];

    elements.each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 9) return;

      const folioCell = $(cells[0]);
      const span = folioCell.find('span');
      // Extract color from inline style
      let color = '';
      const styleAttr = span.attr('style');
      if (styleAttr) {
        // Simple parse for color in style attribute
        const match = styleAttr.match(/color\s*:\s*([^;]+)/i);
        if (match) color = match[1].trim().toLowerCase();
      }

      const folio = folioCell.text().trim();
      const boleto = $(cells[1]).text().trim();
      const zona = $(cells[5]).text().trim();
      const tipo = $(cells[6]).text().trim();
      const terminal = $(cells[7]).text().trim();
      const estado = ($(cells[8]).text() || '').trim().toUpperCase();

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
    });

    return data;
  } catch (error) {
    console.error('Scraper error:', error.message);
    return [];
  }
}

module.exports = scrapeFolios;