const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs folder exists
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// Create a timestamped log file for each day
function getLogFilePath() {
  const date = new Date().toISOString().split('T')[0];
  return path.join(LOGS_DIR, `log-${date}.log`);
}

function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(getLogFilePath(), logMessage, 'utf8');
}

// Colored console logging + persistent log
function info(msg) {
  console.log(chalk.blue(msg));
  writeLog(`INFO: ${msg}`);
}

function success(msg) {
  console.log(chalk.green(msg));
  writeLog(`SUCCESS: ${msg}`);
}

function warning(msg) {
  console.log(chalk.yellow(msg));
  writeLog(`WARNING: ${msg}`);
}

function error(msg) {
  console.log(chalk.red(msg));
  writeLog(`ERROR: ${msg}`);
}

module.exports = { info, success, warning, error };
