const notifier = require('node-notifier');

function showNotification(message) {
  notifier.notify({
    title: 'Nuevo folio reflejado 🚕',
    message,
    sound: 'Notification.Reminder',
    wait: false
  });
}

function showCancelFolio(message) {
  notifier.notify({
    title: '❌ Se ha cancelado un folio ❌',
    message,
    sound: 'Notification.SMS',
    wait: false
  });
}

function showCambio(message) {
  notifier.notify({
    title: '⚠️Folio  de cambio',
    message,
    sound: 'Notification.Default',
    wait: false
  });
}

function showVentaEspecial(message) {
  notifier.notify({
    title: '🎫 VENTA ESPECIAL',
    message,
    sound: 'Notification.Default',
    wait: false
  });
}

module.exports = { showNotification, showCancelFolio, showCambio, showVentaEspecial };