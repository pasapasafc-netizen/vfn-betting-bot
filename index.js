require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Ping
  if (message.content === '!ping') {
    return message.reply('🏆 VFN Betting Bot is online!');
  }

  // Help
  if (message.content === '!help') {
    return message.reply(`
🎮 **VFN BETTING BOT**

Commands:

!ping
!help
!balance
!daily
!bet
`);
  }

  // Balance
  if (message.content === '!balance') {
    return message.reply('💰 Your balance: **1000 Coins**');
  }

  // Daily
  if (message.content === '!daily') {
    return message.reply('🎁 You claimed **500 Coins!**');
  }

  // Bet
  if (message.content === '!bet') {
    return message.reply('⚽ Betting system coming soon...');
  }
});

client.login(process.env.DISCORD_TOKEN);
