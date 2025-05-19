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

module.exports = { showNotification, showCancelFolio };