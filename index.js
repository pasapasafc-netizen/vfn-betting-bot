rrequire("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
} = require("discord.js");

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
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log("🏆 VFN Sportsbook is Online!");
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
  ```js
// ======================
// !ping
// ======================
if (command === "ping") {

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("🏓 Pong!")
    .setDescription("VFN Sportsbook is online.")
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ======================
// !menu
// ======================
if (command === "menu") {

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🏆 VFN Sportsbook")
    .setDescription("Choose an option below.")
    .setFooter({ text: "VFN Sportsbook" })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("balance")
      .setLabel("Balance")
      .setEmoji("💰")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("daily")
      .setLabel("Daily")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("matches")
      .setLabel("Matches")
      .setEmoji("⚽")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("mybets")
      .setLabel("My Bets")
      .setEmoji("🎟")
      .setStyle(ButtonStyle.Secondary)
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("leaderboard")
      .setLabel("Leaderboard")
      .setEmoji("🏆")
      .setStyle(ButtonStyle.Danger)
  );

  return message.reply({
    embeds: [embed],
    components: [row1, row2, row3]
  });
}

// ======================
// !help
// ======================
if (command === "help") {

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("📖 VFN Betting Commands")
    .setDescription(
`🏆 General
!menu
!ping
!help

💰 User
!balance
!daily

⚽ Betting
!matches
!bet
!mybets
!betslip
!cancelbet

🛠 Admin
!creatematch
!closematch
!result

🏆 Stats
!leaderboard`
    )
    .setFooter({
      text: "Use !menu for the button interface."
    });

  return message.reply({
    embeds: [embed]
  });
}

// ======================
// !balance
// ======================
if (command === "balance") {

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("💰 Wallet")
    .setDescription(
      `You currently have **${user.coins.toLocaleString()}** coins.`
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });
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

    const embed = new EmbedBuilder()
      .setColor("#FF9800")
      .setTitle("⏳ Daily Reward")
      .setDescription(
        `Come back in **${hours}h ${minutes}m**`
      );

    return message.reply({
      embeds: [embed]
    });
  }

  user.coins += 500;
  user.lastDaily = now;

  saveUsers(users);

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("🎉 Daily Reward Claimed")
    .setDescription(
      `+500 Coins\n\n💰 New Balance: **${user.coins.toLocaleString()}**`
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed]
  });
}
```
```js
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

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`bet_${id}_${team1}`)
      .setLabel(team1)
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`bet_${id}_${team2}`)
      .setLabel(team2)
      .setStyle(ButtonStyle.Danger)
  );

  return message.reply({
    embeds: [embed],
    components: [row],
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

  for (const match of matches) {

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`🆔 Match #${match.id}`)
      .addFields(
        {
          name: "⚽ Match",
          value: `${match.team1} 🆚 ${match.team2}`,
        },
        {
          name: "📈 Odds",
          value: `🔵 ${match.team1}: ${match.odds1}x\n🔴 ${match.team2}: ${match.odds2}x`,
        },
        {
          name: "📊 Status",
          value: match.status,
          inline: true,
        }
      )
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bet_${match.id}_${match.team1}`)
        .setLabel(match.team1)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(match.status !== "OPEN"),

      new ButtonBuilder()
        .setCustomId(`bet_${match.id}_${match.team2}`)
        .setLabel(match.team2)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(match.status !== "OPEN")
    );

    await message.channel.send({
      embeds: [embed],
      components: [row],
    });
  }

  return;
}
```
```js
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

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("✅ Bet Placed")
    .addFields(
      {
        name: "🆔 Match",
        value: matchId.toString(),
        inline: true,
      },
      {
        name: "🎯 Pick",
        value: team,
        inline: true,
      },
      {
        name: "💰 Stake",
        value: `${amount} coins`,
        inline: true,
      },
      {
        name: "🏦 Remaining Balance",
        value: `${user.coins.toLocaleString()} coins`,
      }
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });
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

  const embed = new EmbedBuilder()
    .setColor("#0099ff")
    .setTitle("🎟 Your Active Bets")
    .setTimestamp();

  myBets.forEach(bet => {

    const match = matches.find(
      m => m.id === bet.matchId
    );

    if (!match) return;

    embed.addFields({
      name: `🆔 Match #${bet.matchId}`,
      value:
`⚽ ${match.team1} 🆚 ${match.team2}
🎯 Pick: ${bet.team}
💰 Stake: ${bet.amount} coins`,
      inline: false,
    });

  });

  return message.reply({
    embeds: [embed],
  });
}
```
```js
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
        value: `${match.team1} 🆚 ${match.team2}`,
      },
      {
        name: "🎯 Pick",
        value: bet.team,
        inline: true,
      },
      {
        name: "💰 Stake",
        value: `${bet.amount.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "📈 Odds",
        value: `${odds}x`,
        inline: true,
      },
      {
        name: "🏆 Potential Win",
        value: `${potentialWin.toLocaleString()} coins`,
      },
      {
        name: "📊 Status",
        value: match.status,
        inline: true,
      }
    )
    .setFooter({
      text: `Player: ${message.author.username}`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed],
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

  const embed = new EmbedBuilder()
    .setColor("#FF9800")
    .setTitle("🔒 Match Closed")
    .setDescription(
      `Match **#${matchId}** has been closed.\nNo more bets can be placed.`
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });
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

  const embed = new EmbedBuilder()
    .setColor("#4CAF50")
    .setTitle("🏆 Match Result Recorded")
    .addFields(
      {
        name: "🏅 Winner",
        value: winner,
      },
      {
        name: "💰 Winners Paid",
        value: winners.toString(),
      }
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });
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

  const embed = new EmbedBuilder()
    .setColor("#F44336")
    .setTitle("❌ Bet Cancelled")
    .setDescription(
      `Your stake of **${bets[index]?.amount ?? 0}** coins has been refunded.`
    )
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });
}

// ======================
// !leaderboard
// ======================
if (command === "leaderboard") {

  const leaderboard = Object.entries(users)
    .sort((a, b) => b[1].coins - a[1].coins)
    .slice(0, 10);

  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("🏆 VFN Leaderboard")
    .setTimestamp();

  leaderboard.forEach(([id, data], index) => {
    embed.addFields({
      name: `#${index + 1}`,
      value: `<@${id}> — 💰 ${data.coins.toLocaleString()} coins`,
      inline: false,
    });
  });

  return message.reply({
    embeds: [embed],
  });
}

});

client.login(process.env.DISCORD_TOKEN);
```
