require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
} = require("discord.js");

const { loadUsers, saveUsers } = require("./db");
const { loadBets, saveBets } = require("./betDb");
const { loadParlays, saveParlays } = require("./parlayDb");
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
      wins: 0,
      losses: 0,
      wagered: 0,
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

  return JSON.parse(
    fs.readFileSync("./matches.json", "utf8")
  );
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

  const args = message.content
    .slice(PREFIX.length)
    .trim()
    .split(/\s+/);

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
`📖 **VFN Betting Commands**

!ping
!help
!balance
!daily
!creatematch
!matches
!bet
!mybets
!betslip
!cancelbet
!closematch
!result
!leaderboard`
    );
  }

  // ======================
  // !balance
  // ======================
  if (command === "balance") {
    return message.reply(
      `💰 Balance: **${user.coins.toLocaleString()}** coins`
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

      const hours = Math.floor(
        remaining / (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (remaining % (1000 * 60 * 60)) /
        (1000 * 60)
      );

      return message.reply(
        `⏳ Come back in ${hours}h ${minutes}m`
      );
    }

    user.coins += 500;
    user.lastDaily = now;

    saveUsers(users);

    return message.reply(
      `🎉 Daily claimed!\n💰 Balance: ${user.coins.toLocaleString()} coins`
    );
  }
    // ======================
  // !creatematch
  // ======================
  if (command === "creatematch") {

    const team1 = args[0];
    const team2 = args[1];
    const odds1 = parseFloat(args[2]);
    const odds2 = parseFloat(args[3]);

    if (!team1 || !team2 || !odds1 || !odds2) {
      return message.reply(
        "Usage: !creatematch Team1 Team2 Odds1 Odds2\nExample: !creatematch Barcelona RealMadrid 1.85 2.30"
      );
    }

    const matches = loadMatches();

    const id = matches.length + 1;

    matches.push({
      id,
      team1,
      team2,
      odds1,
      odds2,
      status: "OPEN",
    });

    saveMatches(matches);

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("⚽ Match Created")
      .addFields(
        {
          name: "🆔 Match ID",
          value: id.toString(),
          inline: true,
        },
        {
          name: "⚔️ Match",
          value: `${team1} 🆚 ${team2}`,
        },
        {
          name: "📈 Odds",
          value: `🔵 ${team1}: ${odds1}x\n🔴 ${team2}: ${odds2}x`,
        },
        {
          name: "📊 Status",
          value: "OPEN",
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Betting Bot",
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });
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
📈 ${match.odds1}x | ${match.odds2}x
📊 ${match.status}

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
        "Usage: !bet MatchID Team Amount"
      );
    }

    const matches = loadMatches();
    const bets = loadBets();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply("❌ Match not found.");
    }

    if (match.status !== "OPEN") {
      return message.reply(
        "❌ Betting is closed."
      );
    }

    if (
      team.toLowerCase() !== match.team1.toLowerCase() &&
      team.toLowerCase() !== match.team2.toLowerCase()
    ) {
      return message.reply(
        "❌ Choose one of the two teams."
      );
    }

    if (user.coins < amount) {
      return message.reply(
        "❌ You don't have enough coins."
      );
    }

    user.coins -= amount;
    user.wagered += amount;

    saveUsers(users);

    bets.push({
      user: message.author.id,
      matchId,
      team,
      amount,
    });

    saveBets(bets);

    return message.reply(
`✅ Bet Placed!

🆔 Match: ${matchId}

🎯 Pick: ${team}

💰 Stake: ${amount}

🏦 Balance: ${user.coins}`
    );
  }

  // ======================
  // !mybets
  // ======================
  if (command === "mybets") {

    const bets = loadBets();

    const myBets = bets.filter(
      b => b.user === message.author.id
    );

    if (myBets.length === 0) {
      return message.reply(
        "❌ No active bets."
      );
    }

    const matches = loadMatches();

    let text = "🎟 **Your Bets**\n\n";

    myBets.forEach(bet => {

      const match = matches.find(
        m => m.id === bet.matchId
      );

      if (!match) return;

      text +=
`🆔 ${bet.matchId}
⚽ ${match.team1} 🆚 ${match.team2}
🎯 ${bet.team}
💰 ${bet.amount} coins

`;

    });

    return message.reply(text);
  }
    // ======================
  // !betslip
  // ======================
  if (command === "betslip") {

    const bets = loadBets();

    const bet = bets.find(
      b => b.user === message.author.id
    );

    if (!bet) {
      return message.reply("❌ You don't have any active bets.");
    }

    const matches = loadMatches();

    const match = matches.find(
      m => m.id === bet.matchId
    );

    if (!match) {
      return message.reply("❌ Match not found.");
    }

    const odds =
      bet.team.toLowerCase() === match.team1.toLowerCase()
        ? match.odds1
        : match.odds2;

    const potentialWin = Math.floor(
      bet.amount * odds
    );

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🎟 VFN BET SLIP")
      .addFields(
        {
          name: "⚽ Match",
          value: `${match.team1} 🆚 ${match.team2}`
        },
        {
          name: "🎯 Pick",
          value: bet.team,
          inline: true
        },
        {
          name: "💰 Stake",
          value: `${bet.amount} coins`,
          inline: true
        },
        {
          name: "📈 Odds",
          value: `${odds}x`,
          inline: true
        },
        {
          name: "🏆 Potential Win",
          value: `${potentialWin} coins`
        },
        {
          name: "📊 Status",
          value: match.status,
          inline: true
        }
      )
      .setFooter({
        text: "VFN Betting Bot"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });
  }

  // ======================
  // !closematch
  // ======================
  if (command === "closematch") {

    const matchId = parseInt(args[0]);

    const matches = loadMatches();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply("❌ Match not found.");
    }

    match.status = "CLOSED";

    saveMatches(matches);

    return message.reply(
      `🔒 Match ${matchId} closed.`
    );
  }

  // ======================
  // !result
  // ======================
  if (command === "result") {

    const matchId = parseInt(args[0]);
    const winner = args[1];

    const matches = loadMatches();
    const bets = loadBets();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply("❌ Match not found.");
    }

    if (match.status === "FINISHED") {
      return message.reply(
        "❌ This match already has a result."
      );
    }

    match.status = "FINISHED";

    let winners = 0;

    bets.forEach(bet => {

      if (
        bet.matchId === matchId &&
        bet.team.toLowerCase() === winner.toLowerCase()
      ) {

        const allUsers = loadUsers();

        const multiplier =
          bet.team.toLowerCase() === match.team1.toLowerCase()
            ? match.odds1
            : match.odds2;

        allUsers[bet.user].coins += Math.floor(
          bet.amount * multiplier
        );

        allUsers[bet.user].wins++;

        saveUsers(allUsers);

        winners++;
      }

    });

    saveBets(
      bets.filter(
        b => b.matchId !== matchId
      )
    );

    saveMatches(matches);

    return message.reply(
`🏆 Result Recorded!

Winner: ${winner}

Paid ${winners} winner(s).`
    );
  }

  // ======================
  // !cancelbet
  // ======================
  if (command === "cancelbet") {

    const matchId = parseInt(args[0]);

    const bets = loadBets();

    const index = bets.findIndex(
      b =>
        b.user === message.author.id &&
        b.matchId === matchId
    );

    if (index === -1) {
      return message.reply(
        "❌ Bet not found."
      );
    }

    user.coins += bets[index].amount;

    saveUsers(users);

    bets.splice(index, 1);

    saveBets(bets);

    return message.reply(
      "✅ Bet cancelled."
    );
  }

  // ======================
  // !leaderboard
  // ======================
  if (command === "leaderboard") {

    const leaderboard = Object.entries(users)
      .sort((a, b) => b[1].coins - a[1].coins)
      .slice(0, 10);

    let text = "🏆 Leaderboard\n\n";

    leaderboard.forEach(([id, data], i) => {
      text += `${i + 1}. <@${id}> — ${data.coins} coins\n`;
    });

    return message.reply(text);
  }
  // ======================
  // !parlay
  // ======================
  if (command === "parlay") {

    const parlays = loadParlays();

    const myParlay = parlays.find(
      p => p.user === message.author.id
    );

    if (!myParlay) {
      return message.reply(
        "❌ You don't have an active parlay yet."
      );
    }
   let text = `🎟 **VFN PARLAY**\n\n`;

text += `💰 Stake: ${myParlay.stake} Coins\n`;
text += `📈 Combined Odds: ${myParlay.totalOdds.toFixed(2)}x\n`;
text += `🏆 Potential Win: ${myParlay.potentialWin} Coins\n`;
text += `📊 Status: ${myParlay.status}\n\n`;

text += "**Selections**\n";

if (myParlay.selections.length === 0) {

  text += "No selections added yet.";

} else {

  myParlay.selections.forEach(selection => {

   text += `⏳ ${selection.team} (${selection.odds.toFixed(2)}x)\n`; 
  });

}

return message.reply(text); 
  }

    // ======================
  // !createparlay
  // ======================
  if (command === "createparlay") {

    const stake = parseInt(args[0]);

    if (!stake || stake <= 0) {
      return message.reply(
        "Usage: !createparlay Amount"
      );
    }

    if (user.coins < stake) {
      return message.reply(
        "❌ You don't have enough coins."
      );
    }

    const parlays = loadParlays();

    const existing = parlays.find(
      p => p.user === message.author.id
    );

    if (existing) {
      return message.reply(
        "❌ You already have an active parlay."
      );
    }

    user.coins -= stake;
    saveUsers(users);

   parlays.push({
  id: Date.now(),

  user: message.author.id,

  stake: stake,

  totalOdds: 1.00,

  potentialWin: stake,

  status: "BUILDING",

  selections: [],

  createdAt: Date.now()
}); 

    saveParlays(parlays);

    return message.reply(
`🎟 Parlay Created!

Stake: ${stake} coins

Selections: 0

Use !addteam to add your first pick.`
    );
  }

   // ======================
  // !addteam
  // ======================
  if (command === "addteam") {

    const matchId = parseInt(args[0]);
    const team = args[1];

    if (!matchId || !team) {
      return message.reply(
        "Usage: !addteam MatchID Team"
      );
    }

    const parlays = loadParlays();

    const myParlay = parlays.find(
      p => p.user === message.author.id
    );

    if (!myParlay) {
      return message.reply(
        "❌ Create a parlay first using !createparlay"
      );
    }

    const matches = loadMatches();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return message.reply(
        "❌ Match not found."
      );
    }

    const odds =
  team.toLowerCase() === match.team1.toLowerCase()
    ? match.odds1
    : match.odds2;

myParlay.selections.push({
  type: "TEAM",
  matchId,
  team,
  odds,
  status: "PENDING"
});
myParlay.totalOdds = 1;

myParlay.selections.forEach(selection => {
  myParlay.totalOdds *= selection.odds;
});

myParlay.potentialWin = Math.floor(
  myParlay.stake * myParlay.totalOdds
);
    saveParlays(parlays);

    return message.reply(
`✅ Team added!

⚽ ${team}

Current Picks:
${myParlay.selections.length}`
    );
  } 
});

client.login(process.env.DISCORD_TOKEN);
