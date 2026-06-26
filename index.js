require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");
const { loadUsers, saveUsers } = require("./db");
const { loadBets, saveBets } = require("./betDb");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!";

// ======================
// USER FUNCTIONS
// ======================
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

// ======================
// MATCH FUNCTIONS
// ======================
function loadMatches() {
  if (!fs.existsSync("./matches.json")) {
    fs.writeFileSync("./matches.json", "[]");
  }

  return JSON.parse(fs.readFileSync("./matches.json", "utf8"));
}

function saveMatches(matches) {
  fs.writeFileSync(
    "./matches.json",
    JSON.stringify(matches, null, 2)
  );
}

// ======================
// BOT READY
// ======================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ======================
// COMMAND HANDLER
// ======================
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
!daily - Claim 500 coins every 24 hours
!creatematch Team1 Team2
!matches - View all matches`
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
      `🎉 You claimed **500 coins!**\n💰 New Balance: **${user.coins.toLocaleString()}** coins.`
    );
  }

  // ======================
  // !creatematch
  // ======================
  if (command === "creatematch") {
    const team1 = args[0];
    const team2 = args[1];

    if (!team1 || !team2) {
      return message.reply(
        "Usage: !creatematch Team1 Team2"
      );
    }

    const matches = loadMatches();

    const id = matches.length + 1;

    matches.push({
      id,
      team1,
      team2,
      status: "OPEN"
    });

    saveMatches(matches);

    return message.reply(
`✅ Match Created!

🆔 ID: ${id}

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

// ======================
// !bet
// ======================
  if (command === "bet") {

  const matchId = parseInt(args[0]);
  const team = args[1];
  const amount = parseInt(args[2]);

  if (!matchId || !team || !amount) {
    return message.reply(
      "Usage: !bet MatchID Team Amount\nExample: !bet 1 Barcelona 500"
    );
  }

  const matches = loadMatches();
  const bets = loadBets();

  const match = matches.find(m => m.id === matchId);

  if (!match) {
    return message.reply("❌ Match not found.");
  }

  if (match.status !== "OPEN") {
    return message.reply("❌ Betting is closed for this match.");
  }

  if (
    team.toLowerCase() !== match.team1.toLowerCase() &&
    team.toLowerCase() !== match.team2.toLowerCase()
  ) {
    return message.reply("❌ Choose one of the two teams playing.");
  }

  if (user.coins < amount) {
    return message.reply("❌ You don't have enough coins.");
  }

  user.coins -= amount;
  saveUsers(users);

  bets.push({
    user: message.author.id,
    matchId,
    team,
    amount
  });

  saveBets(bets);

  return message.reply(
`✅ Bet Placed!

🆔 Match ID: ${matchId}

⚽ ${match.team1} 🆚 ${match.team2}

🎯 Pick: ${team}

💰 Amount: ${amount} coins

🏦 Remaining Balance: ${user.coins}`
  );
}
  // ======================
  // !closematch
  // ======================
  if (command === "closematch") {

    const matchId = parseInt(args[0]);

    if (!matchId) {
      return message.reply("Usage: !closematch MatchID");
    }

    const matches = loadMatches();

    const match = matches.find(m => m.id === matchId);

    if (!match) {
      return message.reply("❌ Match not found.");
    }

    match.status = "CLOSED";

    saveMatches(matches);

    return message.reply(
      `🔒 Match ${matchId} has been closed.\nNo more bets can be placed.`
    );
  }
  });

// ======================
// LOGIN
// ======================
client.login(process.env.DISCORD_TOKEN);
