const notifier = require('node-notifier');

function showNotification(message) {
  notifier.notify({
    title: 'Nuevo folio reflejado',
    message,
    sound: "Notification.Reminder",
    wait: false
  });
}

module.exports = { showNotification };