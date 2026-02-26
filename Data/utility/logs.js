const chalk = require('chalk');
const moment = require('moment-timezone');
const fs = require('fs-extra');
const path = require('path');

const logDir = path.join(__dirname, '../system/database/botdata/logs');
fs.ensureDirSync(logDir);

const getTime = () => moment().tz('Asia/Karachi').format('hh:mm:ss A');
const getDate = () => moment().tz('Asia/Karachi').format('DD/MM/YYYY');

const writeLog = (type, message) => {
  const date = moment().tz('Asia/Karachi').format('YYYY-MM-DD');
  const logFile = path.join(logDir, `${date}.log`);
  const logEntry = `[${getTime()} || ${getDate()}] [${type}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
};

const printBanner = () => {
  process.stdout.write('\n');
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ██████╗ ██████╗ ██╗  ██╗    ██████╗  ██████╗ ████████╗\n'));
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ██╔══██╗██╔══██╗╚██╗██╔╝    ██╔══██╗██╔═══██╗╚══██╔══╝\n'));
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ██████╔╝██║  ██║ ╚███╔╝     ██████╔╝██║   ██║   ██║   \n'));
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ██╔══██╗██║  ██║ ██╔██╗     ██╔══██╗██║   ██║   ██║   \n'));
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ██║  ██║██████╔╝██╔╝ ██╗    ██████╔╝╚██████╔╝   ██║   \n'));
  process.stdout.write(chalk.hex('#FF4D4D').bold('  ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   \n'));
  process.stdout.write('\n');
  process.stdout.write(chalk.green('  WhatsApp: ') + chalk.white.bold('+923301068874\n'));
  process.stdout.write(chalk.green('  Email: ') + chalk.white.bold('sardarrdx@gmail.com\n'));
  process.stdout.write('\n');
};

const logs = {
  banner: printBanner,
  
  info: (title, ...args) => {
    const message = args.join(' ');
    process.stdout.write(`${chalk.gray(`[${getTime()}]`)} ${chalk.cyan.bold(`◈ ${title.toUpperCase()} ◈`)} ${chalk.white(message)}\n`);
    writeLog('INFO', `[${title}] ${message}`);
  },

  success: (title, ...args) => {
    const message = args.join(' ');
    const colors = [chalk.cyanBright, chalk.magentaBright, chalk.yellowBright, chalk.blueBright, chalk.redBright];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    process.stdout.write(`${chalk.gray(`[${getTime()}]`)} ${randomColor.bold(`✔ ${title.toUpperCase()} ✔`)} ${randomColor(message)}\n`);
    writeLog('SUCCESS', `[${title}] ${message}`);
  },

  error: (title, ...args) => {
    const message = args.join(' ');
    process.stdout.write(`${chalk.gray(`[${getTime()}]`)} ${chalk.red.bold(`✘ ${title.toUpperCase()} ✘`)} ${chalk.redBright(message)}\n`);
    writeLog('ERROR', `[${title}] ${message}`);
  },

  warn: (title, ...args) => {
    const message = args.join(' ');
    process.stdout.write(`${chalk.gray(`[${getTime()}]`)} ${chalk.yellow.bold(`⚠ ${title.toUpperCase()} ⚠`)} ${chalk.yellowBright(message)}\n`);
    writeLog('WARN', `[${title}] ${message}`);
  },

  db: (message, status = true) => {
    const icon = status ? '✨' : '❌';
    const color = status ? chalk.magentaBright : chalk.redBright;
    process.stdout.write(`${chalk.gray(`[${getTime()}]`)} ${chalk.magenta.bold(`✦ MONGODB ✦`)} ${color(`${icon} ${message}`)}\n`);
    writeLog('DATABASE', `[MONGODB] ${message}`);
  },

  command: (name, user, threadID, client) => {
    if (!client) return;
    const isCommand = client.commands.has(name.toLowerCase()) || 
                      Array.from(client.commands.values()).some(cmd => cmd.config.aliases && cmd.config.aliases.includes(name.toLowerCase()));
    
    if (!isCommand) return;

    const logMsg = `${name} from ${user} (${threadID})`;
    process.stdout.write(
      `${chalk.gray(`[${getTime()}]`)} ` +
      `${chalk.blue.bold('⚡ COMMAND ⚡')} ` +
      `${chalk.cyan.bold(`${name}`)} ` +
      `${chalk.gray('from')} ` +
      `${chalk.white.bold(user)} ` +
      `${chalk.gray('ID:')} ` +
      `${chalk.blue(threadID)}\n`
    );
    writeLog('COMMAND', logMsg);
  },

  event: (type, threadID) => {
    process.stdout.write(
      `${chalk.gray(`[${getTime()}]`)} ` +
      `${chalk.magenta.bold('☄ EVENT ☄')} ` +
      `${chalk.white.bold(type)} ` +
      `${chalk.gray('in')} ` +
      `${chalk.blue(threadID)}\n`
    );
    writeLog('EVENT', `${type} in ${threadID}`);
  },

  getBrand: () => ({ name: 'RDX', whatsapp: '+923301068874', email: 'sardarrdx@gmail.com' })
};

module.exports = logs;
