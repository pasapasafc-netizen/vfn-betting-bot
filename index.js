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

const matchDate = args[4];
const matchTime = args[5]; 

  if (
  !team1 ||
  !team2 ||
  !odds1 ||
  !odds2 ||
  !matchDate ||
  !matchTime
) {
  return message.reply(
    "Usage: !creatematch Team1 Team2 Odds1 Odds2 YYYY-MM-DD HH:MM\n\nExample:\n!creatematch Arsenal Porto 1.80 2.20 2026-06-28 21:00"
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
  date: matchDate,
  time: matchTime,
  status: "OPEN"
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

  let text = "🏟 **VFN MATCH CENTER**\n\n";

  const now = new Date();

  matches.forEach(match => {

    let statusIcon = "🟢";

    if (match.status === "LOCKED") statusIcon = "🔒";
    if (match.status === "LIVE") statusIcon = "🔴";
    if (match.status === "FINISHED") statusIcon = "✅";

    const kickoff = new Date(`${match.date}T${match.time}:00`);

    const formattedDate = kickoff.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

    const formattedTime = kickoff.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    const minutesUntilKickoff = Math.floor(
      (kickoff.getTime() - now.getTime()) / 60000
    );

    const minutesUntilLock = minutesUntilKickoff - 20;

    let countdown = "";

    if (match.status === "OPEN") {

      if (minutesUntilLock > 60) {

        const hours = Math.floor(minutesUntilLock / 60);
        const mins = minutesUntilLock % 60;

        countdown = `⏳ Betting closes in ${hours}h ${mins}m`;

      } else if (minutesUntilLock > 0) {

        countdown = `⏳ Betting closes in ${minutesUntilLock}m`;

      } else {

        countdown = "🔒 Betting closing soon";

      }

    }

    else if (match.status === "LOCKED") {

      if (minutesUntilKickoff > 0) {

        countdown = `🔒 Betting Closed\nKickoff in ${minutesUntilKickoff}m`;

      } else {

        countdown = "🔴 LIVE NOW";

      }

    }

    else if (match.status === "LIVE") {

      countdown = "🔴 LIVE NOW";

    }

    else {

      countdown = "✅ Match Finished";

    }

    text +=
`🆔 Match #${match.id}

⚽ ${match.team1} 🆚 ${match.team2}

📈 Odds
🔵 ${match.team1}: ${match.odds1}x
🔴 ${match.team2}: ${match.odds2}x

📅 ${formattedDate}

🕒 Kickoff
${formattedTime}

${countdown}

${statusIcon} ${match.status}

━━━━━━━━━━━━━━━━━━━━

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

    if (match.status === "LOCKED") {
  return message.reply(
    "🔒 Betting closed.\nThis match starts in less than 20 minutes."
  );
}

if (match.status !== "OPEN") {
  return message.reply(
    `❌ Betting is unavailable.\nCurrent Match Status: ${match.status}`
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

      // ======================
// !addcoins (ADMIN)
// ======================
if (command === "addcoins") {

  console.log(message.author.username);
  const OWNER_USERNAME = "coachdave2";

if (message.author.username !== OWNER_USERNAME) {
  return message.reply("❌ You don't have permission to use this command.");
}
  const member = message.mentions.users.first();

  if (!member) {
    return message.reply("Usage: !addcoins @user amount");
  }

  const amount = parseInt(args[1]);

  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Enter a valid amount.");
  }

  const users = loadUsers();

  if (!users[member.id]) {
    users[member.id] = {
      balance: 0
    };
  }

  users[member.id].balance += amount;

  saveUsers(users);

  return message.reply(
    `✅ Added **${amount.toLocaleString()}** coins to **${member.username}**.\n\n💰 New Balance: **${users[member.id].balance.toLocaleString()}** coins.`
  );

}

    });
    // ======================
    // Update Active Parlays
    // ======================

    const parlays = loadParlays();

    parlays.forEach(parlay => {

      if (parlay.status !== "ACTIVE") return;

      parlay.selections.forEach(selection => {

        if (
          selection.type === "TEAM" &&
          selection.matchId === matchId
        ) {

          if (
            selection.team.toLowerCase() ===
            winner.toLowerCase()
          ) {

            selection.status = "WON";

          } else {

            selection.status = "LOST";

          }

        }

      });

    });
    parlays.forEach(parlay => {

      if (parlay.status !== "ACTIVE") return;

      const lost = parlay.selections.some(
        s => s.status === "LOST"
      );

      if (lost) {
        parlay.status = "LOST";
        return;
      }

      const allWon = parlay.selections.every(
        s => s.status === "WON"
      );

      if (allWon) {

        parlay.status = "WON";

        const allUsers = loadUsers();

        if (allUsers[parlay.user]) {

          allUsers[parlay.user].coins +=
            parlay.potentialWin;

          saveUsers(allUsers);

        }

      }

    });
    saveParlays(parlays);
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
if (myParlay.status === "WON") {

  text += `🎉 Winnings Paid: ${myParlay.potentialWin} Coins\n\n`;

}

if (myParlay.status === "LOST") {

  text += `💔 Better luck next time!\n\n`;

}
text += "**Selections**\n";

if (myParlay.selections.length === 0) {

  text += "No selections added yet.";

} else {

  myParlay.selections.forEach((selection, index) => {

   const icon =
  selection.status === "WON"
    ? "✅"
    : selection.status === "LOST"
    ? "❌"
    : "⏳";

text += `${index + 1}️⃣ ${icon} ${selection.team} (${selection.odds.toFixed(2)}x)\n`;
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
if (myParlay.status !== "BUILDING") {
  return message.reply(
    "❌ This parlay has already been submitted."
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

    // ======================
  // !removeteam
  // ======================
  if (command === "removeteam") {

    const pickNumber = parseInt(args[0]);

    if (!pickNumber) {
      return message.reply(
        "Usage: !removeteam PickNumber"
      );
    }

    const parlays = loadParlays();

    const myParlay = parlays.find(
      p => p.user === message.author.id
    );

    if (!myParlay) {
      return message.reply(
        "❌ You don't have an active parlay."
      );
    }
if (myParlay.status !== "BUILDING") {
  return message.reply(
    "❌ This parlay has already been submitted."
  );
}
    if (
      pickNumber < 1 ||
      pickNumber > myParlay.selections.length
    ) {
      return message.reply(
        "❌ Invalid selection number."
      );
    }

    const removed = myParlay.selections.splice(
      pickNumber - 1,
      1
    )[0];

    myParlay.totalOdds = 1;

    myParlay.selections.forEach(selection => {
      myParlay.totalOdds *= selection.odds;
    });

    myParlay.potentialWin = Math.floor(
      myParlay.stake * myParlay.totalOdds
    );

    saveParlays(parlays);

    return message.reply(
`✅ Removed ${removed.team}

📈 New Odds: ${myParlay.totalOdds.toFixed(2)}x

🏆 Potential Win: ${myParlay.potentialWin} Coins`
    );
  }

    // ======================
  // !submitparlay
  // ======================
  if (command === "submitparlay") {

    const parlays = loadParlays();

    const myParlay = parlays.find(
      p => p.user === message.author.id
    );

    if (!myParlay) {
      return message.reply(
        "❌ You don't have an active parlay."
      );
    }

    if (myParlay.status !== "BUILDING") {
      return message.reply(
        "❌ This parlay has already been submitted."
      );
    }

    if (myParlay.selections.length < 2) {
      return message.reply(
        "❌ A parlay must have at least 2 selections."
      );
    }

    myParlay.status = "ACTIVE";

    saveParlays(parlays);

    return message.reply(
`🎟 Parlay Submitted!

✅ Status: ACTIVE

📈 Combined Odds: ${myParlay.totalOdds.toFixed(2)}x

🏆 Potential Win: ${myParlay.potentialWin} Coins

Good luck! 🍀`
    );
  }
  // ======================
// AUTO LOCK MATCHES
// ======================

setInterval(() => {

  const matches = loadMatches();
  const now = new Date();

  let updated = false;

  matches.forEach(match => {

    if (match.status === "FINISHED") return;

    const kickoff = new Date(`${match.date}T${match.time}:00`);

    const lockTime = new Date(
      kickoff.getTime() - (20 * 60 * 1000)
    );

    // OPEN -> LOCKED
    if (
      match.status === "OPEN" &&
      now >= lockTime &&
      now < kickoff
    ) {

      match.status = "LOCKED";
      updated = true;

      console.log(
        `🔒 Locked: ${match.team1} vs ${match.team2}`
      );

    }

    // LOCKED -> LIVE
    if (
      match.status === "LOCKED" &&
      now >= kickoff
    ) {

      match.status = "LIVE";
      updated = true;

      console.log(
        `🔴 LIVE: ${match.team1} vs ${match.team2}`
      );

    }

  });

  if (updated) {
    saveMatches(matches);
  }

}, 60000);

});
client.login(process.env.DISCORD_TOKEN);
