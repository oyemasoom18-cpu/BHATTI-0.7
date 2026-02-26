module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'cmd',
    aliases: ['command', 'commands'],
    description: 'Command management',
    usage: 'cmd [info/enable/disable] [command]',
    category: 'Admin',
    adminOnly: true,
    prefix: true
  },
  
  async run({ api, event, args, send, client }) {
    const action = args[0]?.toLowerCase();
    const cmdName = args[1]?.toLowerCase();
    
    if (!action || action === 'list') {
      const commands = [...client.commands.keys()];
      let msg = `COMMANDS LIST (${commands.length})
─────────────────\n`;
      
      const categories = {};
      for (const [name, cmd] of client.commands) {
        const cat = cmd.config.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
      }
      
      for (const [cat, cmds] of Object.entries(categories)) {
        msg += `\n${cat}:\n`;
        msg += cmds.map(c => `  • ${c}`).join('\n') + '\n';
      }
      
      return send.reply(msg);
    }
    
    if (action === 'info') {
      if (!cmdName) {
        return send.reply('Please provide a command name.');
      }
      
      const cmd = client.commands.get(cmdName);
      if (!cmd) {
        return send.reply(`Command "${cmdName}" not found.`);
      }
      
      const cfg = cmd.config;
      return send.reply(`COMMAND INFO: ${cfg.name}
─────────────────
Description: ${cfg.description || 'None'}
Aliases: ${cfg.aliases?.join(', ') || 'None'}
Category: ${cfg.category || 'Other'}
Usage: ${cfg.usage || cfg.name}
Admin Only: ${cfg.adminOnly ? 'Yes' : 'No'}
Prefix Required: ${cfg.prefix !== false ? 'Yes' : 'No'}
Group Only: ${cfg.groupOnly ? 'Yes' : 'No'}`);
    }
    
    return send.reply(`Usage: cmd [list/info] [command]`);
  }
};

