const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const notifier = require('node-notifier');
const logger = require('./utils/logger');

// ---------------------------------------------------------------------------
// Reproducción de audio por terminal
// ---------------------------------------------------------------------------
// Cuando entra un folio nuevo, además del sonido de la notificación del sistema
// se reproduce un audio pregrabado que anuncia la terminal correspondiente
// (A, B o C). Los audios viven en la carpeta audio/ y se nombran como
// terminal{A,B,C,...}.mpeg.
//
// El campo "terminal" que llega del scraper (columna 7 de la tabla) puede venir
// como "TERMINAL A", "TERMINAL B", etc. La función extractTerminalLetter() se
// encarga de extraer la letra correcta para componer el nombre del archivo.
// ---------------------------------------------------------------------------

// Resuelve la carpeta audio/ al lado del ejecutable/script (funciona tanto en
// modo fuente como cuando la app está empaquetada con pkg).
const isPkg = typeof process.pkg !== 'undefined';
const rootDir = isPkg ? path.dirname(process.execPath) : __dirname;
const audioDir = path.join(rootDir, 'audio');

// Pausa (en milisegundos) entre un audio y el siguiente cuando salen varios
// folios seguidos, para que no suenen "pegados".
const AUDIO_GAP_MS = 700;

// Cola de audios pendientes. Cada elemento es { letter, audioPath, terminal }.
const audioQueue = [];
let isPlaying = false;

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

/**
 * Traduce el valor del campo "terminal" (texto de la columna 7 de la tabla de
 * folios) a la letra de terminal que se usa para nombrar el archivo de audio.
 *
 * Mapeo soportado (se evalúa en este orden):
 *   1. "Terminal X"  ->  la letra X (p. ej. "TERMINAL B" -> "B").
 *   2. "NACIONAL" o "INTERNACIONAL"  ->  "A".
 *      La terminal A tiene dos puertas (nacional e internacional), por lo que
 *      cualquiera de esos dos valores corresponde a la terminal A.
 *   3. Una letra suelta "A", "B", "C", ...  ->  esa misma letra.
 *   4. Cualquier otro valor  ->  null (no se reproduce audio).
 *
 * @param {string} terminal - Valor del campo terminal scrapeado.
 * @returns {string|null} Letra de terminal en mayúsculas o null si no aplica.
 */
function extractTerminalLetter(terminal) {
  const text = (terminal || '').toUpperCase();

  // 1. Formato "TERMINAL A", "TERMINAL B", etc.
  const terminalMatch = text.match(/TERMINAL\s+([A-Z])/);
  if (terminalMatch) {
    return terminalMatch[1];
  }

  // 2. La terminal A se identifica por su puerta: "NACIONAL" o "INTERNACIONAL".
  //    Usamos límites de palabra (\b) porque "NACIONAL" es subcadena de
  //    "INTERNACIONAL", y así distinguirlos correctamente.
  if (/\bNACIONAL\b/.test(text) || /\bINTERNACIONAL\b/.test(text)) {
    return 'A';
  }

  // 3. Si es una letra suelta (A, B, C...), la usamos directamente.
  const singleLetter = text.trim().match(/^([A-Z])$/);
  if (singleLetter) {
    return singleLetter[1];
  }

  return null;
}

/**
 * Reproduce el audio pregrabado de la terminal indicada desde la carpeta audio/.
 *
 * Los audios se encolan y se reproducen uno después de otro, con una breve
 * pausa (AUDIO_GAP_MS) entre cada uno, para evitar que se solapen cuando
 * entran varios folios seguidos.
 *
 * Flujo:
 *   1. Obtiene la letra de la terminal con extractTerminalLetter().
 *   2. Compone la ruta audio/terminal{LETRA}.mpeg y verifica que exista.
 *   3. Agrega el audio a la cola y arranca el procesamiento si está libre.
 *
 * @param {string} terminal - Valor del campo terminal scrapeado del folio.
 */
function playTerminalAudio(terminal) {
  const letter = extractTerminalLetter(terminal);
  logger.info(`[playTerminalAudio] terminal="${terminal}" -> letter="${letter}"`);
  if (!letter) {
    logger.warn(`[playTerminalAudio] Could not resolve a terminal letter from "${terminal}". Skipping audio.`);
    return;
  }

  const audioPath = path.join(audioDir, `terminal${letter}.mpeg`);
  logger.info(`[playTerminalAudio] Looking for audio at: ${audioPath}`);
  if (!fs.existsSync(audioPath)) {
    logger.warn(`[playTerminalAudio] Audio file NOT found: ${audioPath}`);
    return;
  }

  audioQueue.push({ letter, audioPath, terminal });
  logger.info(`[playTerminalAudio] Queued terminal${letter}.mpeg (queue size: ${audioQueue.length})`);
  processQueue();
}

/**
 * Procesa la cola de audios: reproduce el siguiente audio pendiente y, al
 * terminar, espera AUDIO_GAP_MS antes de reproducir el siguiente.
 */
function processQueue() {
  if (isPlaying || audioQueue.length === 0) return;

  const { letter, audioPath, terminal } = audioQueue.shift();
  isPlaying = true;
  logger.info(`[playTerminalAudio] Playing terminal${letter}.mpeg ...`);

  // Script de PowerShell que reproduce el audio usando la API MCI (Media Control
  // Interface) de Windows a través de mciSendString en winmm.dll.
  // A diferencia del objeto COM de Windows Media Player, MCI no necesita un
  // "message pump", por lo que funciona en procesos no interactivos.
  const safePath = audioPath.replace(/'/g, "''");
  const psScript = [
    'Add-Type -TypeDefinition @"',
    'using System;',
    'using System.Runtime.InteropServices;',
    'public class MCI {',
    '  [DllImport("winmm.dll", CharSet = CharSet.Auto)]',
    '  public static extern int mciSendString(string cmd, System.Text.StringBuilder ret, int len, IntPtr hw);',
    '}',
    '"@',
    `$file = '${safePath}';`,
    '$ret = New-Object System.Text.StringBuilder 256;',
    '$r1 = [MCI]::mciSendString("open `"$file`" type mpegvideo alias media", $ret, $ret.Capacity, [IntPtr]::Zero);',
    '$r2 = [MCI]::mciSendString("play media wait", $ret, $ret.Capacity, [IntPtr]::Zero);',
    '$r3 = [MCI]::mciSendString("close media", $ret, $ret.Capacity, [IntPtr]::Zero);',
    'Write-Host "MCI open=$r1 play=$r2 close=$r3"'
  ].join('\n');

  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], (err, stdout, stderr) => {
    if (stdout) logger.info(`[playTerminalAudio] PowerShell stdout: ${stdout.trim()}`);
    if (stderr) logger.warn(`[playTerminalAudio] PowerShell stderr: ${stderr.trim()}`);
    if (err) {
      logger.warn(`[playTerminalAudio] Failed to play terminal audio for "${terminal}": ${err.message}`);
    } else {
      logger.info(`[playTerminalAudio] Playback finished for terminal${letter}.mpeg`);
    }

    // Pausa breve antes del siguiente audio para que no suenen pegados.
    setTimeout(() => {
      isPlaying = false;
      processQueue();
    }, AUDIO_GAP_MS);
  });
}

module.exports = { showNotification, showCancelFolio, showCambio, showVentaEspecial, playTerminalAudio };