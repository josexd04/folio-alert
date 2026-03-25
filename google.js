
const logger = require('./utils/logger');

/**
 * Sends a new ticket to the Google Apps Script Web App.
 * @param {string} folio - The full folio number.
 * @param {string} zona - The assigned zone.
 * @param {string} tipo - The ticket type.
 * @param {string} terminal - The terminal identifier.
 */
async function enviarBoleto(folio, zona, tipo, terminal) {
  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) {
    logger.warn('GOOGLE_SCRIPT_URL not found in .env file. Skipping ticket submission.');
    return;
  }

  const payload = {
    folio,
    zona,
    tipo,
    terminal,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    // Intentamos obtener el texto de la respuesta de Google para ser más específicos
    const responseText = await response.text();

    if (response.ok) {
      logger.info(`[Google Script] Ticket ${folio} procesado con éxito. Respuesta: ${responseText || 'OK'}`);
    } else {
      logger.error(`[Google Script Error] Fallo al enviar ticket ${folio}. Status: ${response.status}. Respuesta: ${responseText || 'Sin respuesta'}`);
    }
  } catch (error) {
    logger.error(`Error sending ticket ${folio} to Google Sheets:`, error);
  }
}

module.exports = { enviarBoleto };
