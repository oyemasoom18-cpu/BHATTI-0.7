module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'pending',
    aliases: ['pendinglist', 'pendingreq'],
    description: "View and approve pending group join requests.",
    usage: 'pending - Lists all | Reply with number to approve',
    category: 'Utility',
    adminOnly: true,
    prefix: true
  },
  
  pendingData: new Map(),
  
  async run({ api, event, send, client, Threads }) {
    const { threadID, senderID } = event;
    
    const threads = Threads.getAll().filter(t => t.approved !== 1 && t.banned !== 1);
    
    if (threads.length === 0) {
      return send.reply('✅ Koi pending group nahi hai!');
    }
    
    let msg = `📋 PENDING GROUPS (${threads.length})\n`;
    msg += `═══════════════════════\n\n`;
    
    const pendingList = [];
    
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      pendingList.push({
        index: i + 1,
        id: thread.id,
        name: thread.name || 'Unknown Group'
      });
      
      if (i < 20) {
        msg += `${i + 1}. ${thread.name || 'Unknown'}\n`;
        msg += `   ID: ${thread.id}\n\n`;
      }
    }
    
    if (threads.length > 20) {
      msg += `... aur ${threads.length - 20} more groups\n\n`;
    }
    
    msg += `═══════════════════════\n`;
    msg += `📌 Reply with number to approve\n`;
    msg += `📌 Reply "all" to approve all\n`;
    msg += `📌 Reply "1,3,5" for multiple`;
    
    this.pendingData.set(threadID, pendingList);
    
    const info = await send.reply(msg);
    
    if (client.replies && info?.messageID) {
      client.replies.set(info.messageID, {
        commandName: 'pending',
        author: senderID,
        data: { pendingList, threadID }
      });
      
      setTimeout(() => {
        if (client.replies) client.replies.delete(info.messageID);
        this.pendingData.delete(threadID);
      }, 300000);
    }
  },
  
  async handleReply({ api, event, send, client, Threads, data, config }) {
    const { body, senderID, threadID } = event;
    
    if (!body) return;
    
    const originalAuthor = data?.author;
    const isAdmin = config?.ADMINBOT?.includes(senderID);
    
    if (originalAuthor && senderID !== originalAuthor && !isAdmin) {
      return send.reply('Sirf command use karne wala ya admin is reply ko use kar sakta hai.');
    }
    
    const pendingList = data?.pendingList || this.pendingData.get(threadID);
    
    if (!pendingList || pendingList.length === 0) {
      return send.reply('Pending data expire ho gaya, phir se .pending run karo.');
    }
    
    const input = body.trim().toLowerCase();
    
    let toApprove = [];
    
    if (input === 'all') {
      toApprove = pendingList;
    } else if (input.includes(',')) {
      const nums = input.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      for (const num of nums) {
        const item = pendingList.find(p => p.index === num);
        if (item) toApprove.push(item);
      }
    } else {
      const num = parseInt(input);
      if (!isNaN(num)) {
        const item = pendingList.find(p => p.index === num);
        if (item) toApprove.push(item);
      }
    }
    
    if (toApprove.length === 0) {
      return send.reply('Invalid number. List mein se number choose karo.');
    }
    
    await send.reply(`⏳ ${toApprove.length} group(s) approve ho rahe hain...`);
    
    let approved = 0;
    let failed = 0;
    let results = [];
    
    for (const item of toApprove) {
      try {
        Threads.update(item.id, { approved: 1 });
        
        try {
          await api.sendMessage('✅ Group approved! Bot is now active.', item.id);
        } catch {}
        
        approved++;
        results.push(`✅ ${item.name}`);
        
        await new Promise(r => setTimeout(r, 500));
      } catch (error) {
        failed++;
        results.push(`❌ ${item.name}`);
      }
    }
    
    let resultMsg = `📋 APPROVE RESULTS\n`;
    resultMsg += `═══════════════════════\n`;
    resultMsg += `✅ Approved: ${approved}\n`;
    resultMsg += `❌ Failed: ${failed}\n`;
    resultMsg += `───────────────────────\n`;
    resultMsg += results.slice(0, 10).join('\n');
    if (results.length > 10) {
      resultMsg += `\n... aur ${results.length - 10} more`;
    }
    
    this.pendingData.delete(threadID);
    
    return send.reply(resultMsg);
  }
};

