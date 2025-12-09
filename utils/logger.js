const { LOG_LEVEL } = require('../config');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = levels[(LOG_LEVEL || 'info').toLowerCase()] || levels.info;

function formatMessage(level, message, args) {
  const timestamp = new Date().toISOString();
  const argsString = args.length ? ' ' + args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : String(a)
  ).join(' ') : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${argsString}`;
}

module.exports = {
  error: (msg, ...args) => {
    if (levels.error <= currentLevel) console.error(formatMessage('error', msg, args));
  },
  warn: (msg, ...args) => {
    if (levels.warn <= currentLevel) console.warn(formatMessage('warn', msg, args));
  },
  info: (msg, ...args) => {
    if (levels.info <= currentLevel) console.log(formatMessage('info', msg, args));
  },
  debug: (msg, ...args) => {
    if (levels.debug <= currentLevel) console.debug(formatMessage('debug', msg, args));
  }
};