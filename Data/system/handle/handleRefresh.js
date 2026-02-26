const fs = require('fs-extra');
const path = require('path');
const logs = require('../../utility/logs');

function clearRequireCache(filePath) {
  const resolvedPath = require.resolve(filePath);

  if (require.cache[resolvedPath]) {
    const mod = require.cache[resolvedPath];
    if (mod.children) {
      mod.children.forEach(child => {
        if (child.id.includes('RDX/commands') || child.id.includes('RDX/events')) {
          delete require.cache[child.id];
        }
      });
    }
    delete require.cache[resolvedPath];
  }
}

async function loadCommands(client, commandsPath) {
  client.commands.clear();
  let commandCount = 0;

  try {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const filePath = path.join(commandsPath, file);
        clearRequireCache(filePath);
        const command = require(filePath);

        if (command.config && command.config.name) {
          // CREDIT GUARD SYSTEM
          if (command.config.credits !== "SARDAR RDX") {
            logs.error('SECURITY', `UNAUTHORIZED CREDIT DETECTED IN ${file}`);
            logs.error('SECURITY', 'SYSTEM LOCKDOWN INITIATED');
            process.exit(101); // Special exit code for "Index Error Loop"
          }

          client.commands.set(command.config.name.toLowerCase(), command);
          commandCount++;

          if (command.config.aliases && Array.isArray(command.config.aliases)) {
            command.config.aliases.forEach(alias => {
              client.commands.set(alias.toLowerCase(), command);
            });
          }

          logs.success('COMMAND', `Loaded: ${command.config.name}`);
        }
      } catch (error) {
        logs.error('COMMAND', `Failed to load ${file}: ${error.message}`);
      }
    }

    logs.info('REFRESH', `Loaded ${commandCount} commands`);
    return { success: true, count: commandCount };
  } catch (error) {
    logs.error('REFRESH', 'Failed to load commands:', error.message);
    return { success: false, error: error.message };
  }
}

async function loadEvents(client, eventsPath) {
  client.events.clear();

  try {
    const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
      try {
        const filePath = path.join(eventsPath, file);
        clearRequireCache(filePath);
        const event = require(filePath);

        if (event.config && event.config.name) {
          client.events.set(event.config.name.toLowerCase(), event);
          logs.success('EVENT', `Loaded: ${event.config.name}`);
        }
      } catch (error) {
        logs.error('EVENT', `Failed to load ${file}: ${error.message}`);
      }
    }

    logs.info('REFRESH', `Loaded ${client.events.size} events`);
    return { success: true, count: client.events.size };
  } catch (error) {
    logs.error('REFRESH', 'Failed to load events:', error.message);
    return { success: false, error: error.message };
  }
}

async function reloadCommand(client, commandsPath, commandName) {
  try {
    const lowerName = commandName.toLowerCase();
    let filePath = path.join(commandsPath, `${lowerName}.js`);

    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
      let found = false;

      for (const file of files) {
        const tempPath = path.join(commandsPath, file);
        try {
          clearRequireCache(tempPath);
          const cmd = require(tempPath);
          if (cmd.config) {
            const cmdName = cmd.config.name?.toLowerCase();
            const aliases = cmd.config.aliases?.map(a => a.toLowerCase()) || [];

            if (cmdName === lowerName || aliases.includes(lowerName)) {
              filePath = tempPath;
              found = true;
              break;
            }
          }
        } catch (e) { }
      }

      if (!found) {
        return { success: false, error: `Command "${commandName}" not found` };
      }
    }

    clearRequireCache(filePath);
    const command = require(filePath);

    if (command.config && command.config.name) {
      const oldAliases = [];
      client.commands.forEach((cmd, key) => {
        if (cmd.config?.name?.toLowerCase() === command.config.name.toLowerCase()) {
          oldAliases.push(key);
        }
      });
      oldAliases.forEach(alias => client.commands.delete(alias));

      client.commands.set(command.config.name.toLowerCase(), command);

      if (command.config.aliases && Array.isArray(command.config.aliases)) {
        command.config.aliases.forEach(alias => {
          client.commands.set(alias.toLowerCase(), command);
        });
      }

      logs.success('RELOAD', `Reloaded: ${command.config.name}`);
      return { success: true, name: command.config.name };
    }

    return { success: false, error: 'Invalid command structure' };
  } catch (error) {
    logs.error('RELOAD', `Failed to reload ${commandName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function reloadEvent(client, eventsPath, eventName) {
  try {
    const lowerName = eventName.toLowerCase();
    let filePath = path.join(eventsPath, `${lowerName}.js`);

    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
      let found = false;

      for (const file of files) {
        if (file.toLowerCase().replace('.js', '') === lowerName) {
          filePath = path.join(eventsPath, file);
          found = true;
          break;
        }
      }

      if (!found) {
        return { success: false, error: `Event "${eventName}" not found` };
      }
    }

    clearRequireCache(filePath);
    const event = require(filePath);

    if (event.config && event.config.name) {
      client.events.set(event.config.name.toLowerCase(), event);
      logs.success('RELOAD', `Reloaded event: ${event.config.name}`);
      return { success: true, name: event.config.name };
    }

    return { success: false, error: 'Invalid event structure' };
  } catch (error) {
    logs.error('RELOAD', `Failed to reload event ${eventName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function loadNewCommand(client, commandsPath, commandName) {
  try {
    const filePath = path.join(commandsPath, `${commandName.toLowerCase()}.js`);

    if (!fs.existsSync(filePath)) {
      return { success: false, error: `File "${commandName}.js" not found` };
    }

    clearRequireCache(filePath);
    const command = require(filePath);

    if (command.config && command.config.name) {
      client.commands.set(command.config.name.toLowerCase(), command);

      if (command.config.aliases && Array.isArray(command.config.aliases)) {
        command.config.aliases.forEach(alias => {
          client.commands.set(alias.toLowerCase(), command);
        });
      }

      logs.success('LOAD', `Loaded new command: ${command.config.name}`);
      return { success: true, name: command.config.name };
    }

    return { success: false, error: 'Invalid command structure' };
  } catch (error) {
    logs.error('LOAD', `Failed to load ${commandName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

module.exports = {
  loadCommands,
  loadEvents,
  reloadCommand,
  reloadEvent,
  loadNewCommand,
  clearRequireCache
};
