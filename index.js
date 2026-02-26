/*
 * RDX BOT - Advanced Controller
 * Optimized for Stability and Performance
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment-timezone');

// Configuration
const BOT_SCRIPT = 'RDX.js';
const RESTART_DELAY = 1000; // 1 second
const MAX_RESTARTS_FAST = 10; // allow 10 restarts in short window
const FAST_RESTART_WINDOW = 60000; // 1 minute

let restartCount = 0;
let lastRestartTime = Date.now();

function getTimestamp() {
  return moment().tz('Asia/Karachi').format('hh:mm:ss A');
}

function log(type, message) {
  const timestamp = getTimestamp();
  switch (type) {
    case 'INFO':
      console.log(chalk.blue(`[${timestamp}] [INFO]`), message);
      break;
    case 'SUCCESS':
      console.log(chalk.green(`[${timestamp}] [OK]  `), message);
      break;
    case 'WARN':
      console.log(chalk.yellow(`[${timestamp}] [WARN]`), message);
      break;
    case 'ERROR':
      console.log(chalk.red(`[${timestamp}] [ERR] `), message);
      break;
    case 'SYSTEM':
      console.log(chalk.magenta(`[${timestamp}] [SYS] `), message);
      break;
  }
}

function showBanner() {
  console.clear();
  console.log(chalk.red.bold(`
██████╗ ██████╗ ██╗  ██╗
██╔══██╗██╔══██╗╚██╗██╔╝
██████╔╝██║  ██║ ╚███╔╝ 
██╔══██╗██║  ██║ ██╔██╗ 
██║  ██║██████╔╝██╔╝ ██╗
╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝
    `));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.gray(` Owner: SARDAR RDX`));
  console.log(chalk.gray(` System: ${process.platform} | Node: ${process.version}`));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

function start() {
  // Reset restart counter if enough time has passed
  if (Date.now() - lastRestartTime > FAST_RESTART_WINDOW) {
    restartCount = 0;
  }

  lastRestartTime = Date.now();

  log('SYSTEM', 'Starting RDX Bot Process...');

  // Check if RDX.js exists
  try {
    require.resolve('./' + BOT_SCRIPT);
  } catch (e) {
    log('ERROR', `Could not find ${BOT_SCRIPT}!`);
    return;
  }

  const botProcess = spawn('node', [BOT_SCRIPT], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  botProcess.on('error', (err) => {
    log('ERROR', `Failed to start process: ${err.message}`);
  });

  botProcess.on('close', (code) => {
    if (code === 101) {
      // CREDIT VIOLATION DETECTED - INFINITE ERROR LOOP
      console.clear();
      const warning = `
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║   CRITICAL SECURITY VIOLATION DETECTED                       ║
    ║   COMMAND CREDIT HAS BEEN TAMPERED WITH                      ║
    ║   AUTHORSHIP MUST BE: "SARDAR RDX"                           ║
    ║                                                              ║
    ║   THE SYSTEM IS NOW LOCKED. REVERT CHANGES TO CONTINUE.      ║
    ║                                                              ║
    ╚══════════════════════════════════════════════════════════════╝
      `;

      let counter = 0;
      const interval = setInterval(() => {
        console.clear();
        console.log(chalk.red.bold(warning));
        console.log(chalk.yellow(`    RESTARTING SYSTEM CHECK IN 3 SECONDS...`));
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        start(); // Restart to check again
      }, 3000);
      return;
    }

    if (code === null) {
      log('WARN', 'Bot process terminated via signal.');
      process.exit(0);
    } else if (code === 0) {
      log('SUCCESS', 'Bot stopped cleanly.');
      process.exit(0);
    } else {
      restartCount++;

      if (restartCount > MAX_RESTARTS_FAST) {
        log('ERROR', `Unstable! ${restartCount} restarts in 1 minute. Pausing for 30s...`);
        setTimeout(start, 30000);
      } else {
        log('WARN', `Bot crashed (Exit Code: ${code}). Restarting in ${RESTART_DELAY / 1000}s...`);
        setTimeout(start, RESTART_DELAY);
      }
    }
  });
}

// Initial Start
showBanner();
log('SYSTEM', 'Initializing RDX Bot Controller...');
start();
