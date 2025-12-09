const notifier = require('node-notifier');

/**
 * Shows a system notification for a new normal folio.
 * @param {string} message - The body of the notification.
 */
function showNotification(message) {
  if (notifier) {
    notifier.notify({
      title: 'Nuevo folio reflejado 🚕',
      message,
      sound: 'Notification.Reminder',
      wait: false
    });
  }
}

/**
 * Shows a system notification when a folio is canceled.
 * @param {string} message - The body of the notification.
 */
function showCancelFolio(message) {
  if (notifier) {
    notifier.notify({
      title: '❌ Se ha cancelado un folio ❌',
      message,
      sound: 'Notification.SMS',
      wait: false
    });
  }
}

/**
 * Shows a system notification for a "CAMBIO" folio.
 * @param {string} message - The body of the notification.
 */
function showCambio(message) {
  if (notifier) {
    notifier.notify({
      title: '⚠️ Folio de cambio',
      message,
      sound: 'Notification.Default',
      wait: false
    });
  }
}

/**
 * Shows a system notification for a "VENTA ESPECIAL" folio.
 * @param {string} message - The body of the notification.
 */
function showVentaEspecial(message) {
  if (notifier) {
    notifier.notify({
      title: '🎫 VENTA ESPECIAL',
      message,
      sound: 'Notification.Default',
      wait: false
    });
  }
}

module.exports = { showNotification, showCancelFolio, showCambio, showVentaEspecial };