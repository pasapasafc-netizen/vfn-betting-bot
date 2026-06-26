require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { loadUsers, saveUsers } = require("./db");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!";

function getUser(users, userId) {
  if (!users[userId]) {
    users[userId] = {
      coins: 0,
      lastDaily: 0,
    };
    saveUsers(users);
  }

  return users[userId];
}

function loadMatches() {
  if (!fs.existsSync("./matches.json")) {
    fs.writeFileSync("./matches.json", "[]");
  }

  return JSON.parse(fs.readFileSync("./matches.json", "utf8"));
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  const users = loadUsers();
  const user = getUser(users, message.author.id);

  // ======================
  // !ping
  // ======================
  if (command === "ping") {
    return message.reply("🏓 Pong!");
  }

  // ======================
  // !help
  // ======================
  if (command === "help") {
    return message.reply(
`📖 **Betting Bot Commands**

!ping - Check bot latency
!help - Show this menu
!balance - View your balance
!daily - Claim 500 coins
!creatematch Team1 Team2
!matches - View all open matches`
    );
  }

  // ======================
  // !balance
  // ======================
  if (command === "balance") {
    return message.reply(
      `💰 You currently have **${user.coins.toLocaleString()}** coins.`
    );
  }

  // ======================
  // !daily
  // ======================
  if (command === "daily") {
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;

    if (now - user.lastDaily < cooldown) {
      const remaining = cooldown - (now - user.lastDaily);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60)) / (1000 * 60)
      );

      return message.reply(
        `⏳ You already claimed your daily reward.\nCome back in **${hours}h ${minutes}m**.`
      );
    }

    user.coins += 500;
    user.lastDaily = now;

    saveUsers(users);

    return message.reply(
      `🎉 You claimed **500 coins!**\n💰 Balance: **${user.coins.toLocaleString()}** coins.`
    );
  }

  // ======================
  // !creatematch
  // ======================
  if (command === "creatematch") {
    const team1 = args[0];
    const team2 = args[1];

    if (!team1 || !team2) {
      return message.reply("Usage: !creatematch Team1 Team2");
    }

    return message.reply(
`✅ Match Created!

🆔 ID: 1

⚽ ${team1} 🆚 ${team2}

📊 Status: OPEN`
    );
  }

  // ======================
  // !matches
  // ======================
  if (command === "matches") {
    const matches = loadMatches();

    if (matches.length === 0) {
      return message.reply("❌ No matches available.");
    }

    let text = "📋 **Open Matches**\n\n";

    matches.forEach(match => {
      text +=
`🆔 ${match.id}
⚽ ${match.team1} 🆚 ${match.team2}
📊 Status: ${match.status}

`;
    });

    return message.reply(text);
  }
});

client.login(process.env.DISCORD_TOKEN);
