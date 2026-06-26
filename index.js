require("dotenv").config();

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
    // ======================
  // !ping
  // ======================
  if (command === "ping") {

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🏓 Pong!")
      .setDescription("VFN Sportsbook is online.")
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });
  }

  // ======================
  // !help
  // ======================
  if (command === "help") {

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("📖 VFN Sportsbook Help")
      .setDescription("Available Commands")
      .addFields(
        {
          name: "🎮 General",
          value:
"`!menu`\n`!ping`\n`!help`",
          inline: true,
        },
        {
          name: "💰 User",
          value:
"`!balance`\n`!daily`\n`!mybets`\n`!betslip`",
          inline: true,
        },
        {
          name: "⚽ Betting",
          value:
"`!matches`\n`!bet`\n`!cancelbet`\n`!leaderboard`",
          inline: false,
        },
        {
          name: "👑 Admin",
          value:
"`!creatematch`\n`!closematch`\n`!result`",
          inline: false,
        }
      )
      .setFooter({
        text: "VFN Sportsbook"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });
  }

  // ======================
  // !menu
  // ======================
  if (command === "menu") {

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🏆 VFN Sportsbook")
      .setDescription(
        "Choose an option below."
      )
      .setFooter({
        text: "VFN Sportsbook"
      });

    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("balance")
          .setLabel("Balance")
          .setEmoji("💰")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("daily")
          .setLabel("Daily")
          .setEmoji("🎁")
          .setStyle(ButtonStyle.Success)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("matches")
          .setLabel("Matches")
          .setEmoji("⚽")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("mybets")
          .setLabel("My Bets")
          .setEmoji("🎟️")
          .setStyle(ButtonStyle.Secondary)
      );

    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("leaderboard")
          .setLabel("Leaderboard")
          .setEmoji("🏆")
          .setStyle(ButtonStyle.Danger)
      );

    return message.reply({
      embeds: [embed],
      components: [row1, row2, row3],
    });
  }

  // ======================
  // !balance
  // ======================
  if (command === "balance") {

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("💰 Wallet")
      .setDescription(
        `You have **${user.coins.toLocaleString()}** coins.`
      )
      .setFooter({
        text: message.author.username
      });

    return message.reply({
      embeds: [embed],
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
        .setColor("#ff9900")
        .setTitle("⏳ Daily Cooldown")
        .setDescription(
          `Come back in **${hours}h ${minutes}m**`
        );

      return message.reply({
        embeds: [embed],
      });
    }

    user.coins += 500;
    user.lastDaily = now;

    saveUsers(users);

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🎉 Daily Reward")
      .setDescription(
        "You received **500 coins!**"
      )
      .addFields({
        name: "💰 New Balance",
        value: `${user.coins.toLocaleString()} coins`,
      });

    return message.reply({
      embeds: [embed],
    });
  }
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
      .setTitle("🏆 New Betting Match")
      .setDescription(
        `**Match #${id}**\n\n⚽ **${team1} 🆚 ${team2}**`
      )
      .addFields(
        {
          name: "📈 Odds",
          value:
`🔵 ${team1}: **${odds1}x**
🔴 ${team2}: **${odds2}x**`,
        },
        {
          name: "📊 Status",
          value: "🟢 OPEN",
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Sportsbook"
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(`bet_${id}_${team1}`)
          .setLabel(team1)
          .setEmoji("🔵")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`bet_${id}_${team2}`)
          .setLabel(team2)
          .setEmoji("🔴")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId(`match_${id}`)
          .setLabel("Match Info")
          .setEmoji("📊")
          .setStyle(ButtonStyle.Secondary)

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
        .setColor(
          match.status === "OPEN"
            ? "#00C853"
            : "#FF9800"
        )
        .setTitle(`🏆 Match #${match.id}`)
        .setDescription(
          `⚽ **${match.team1} 🆚 ${match.team2}**`
        )
        .addFields(
          {
            name: "📈 Odds",
            value:
`🔵 ${match.team1}: **${match.odds1}x**
🔴 ${match.team2}: **${match.odds2}x**`,
          },
          {
            name: "📊 Status",
            value: match.status,
            inline: true,
          }
        )
        .setFooter({
          text: "VFN Sportsbook"
        });

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId(`bet_${match.id}_${match.team1}`)
            .setLabel(match.team1)
            .setEmoji("🔵")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(match.status !== "OPEN"),

          new ButtonBuilder()
            .setCustomId(`bet_${match.id}_${match.team2}`)
            .setLabel(match.team2)
            .setEmoji("🔴")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(match.status !== "OPEN"),

          new ButtonBuilder()
            .setCustomId(`match_${match.id}`)
            .setLabel("Info")
            .setEmoji("📊")
            .setStyle(ButtonStyle.Secondary)

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

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Invalid Bet")
      .setDescription(
        "Usage:\n`!bet MatchID Team Amount`\n\nExample:\n`!bet 1 Barcelona 500`"
      );

    return message.reply({
      embeds: [embed],
    });
  }

  const matches = loadMatches();
  const bets = loadBets();

  const match = matches.find(
    m => m.id === matchId
  );

  if (!match) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF3B30")
          .setTitle("❌ Match Not Found")
      ],
    });

  }

  if (match.status !== "OPEN") {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF9500")
          .setTitle("🔒 Betting Closed")
          .setDescription(
            "This match is no longer accepting bets."
          )
      ],
    });

  }

  if (
    team.toLowerCase() !== match.team1.toLowerCase() &&
    team.toLowerCase() !== match.team2.toLowerCase()
  ) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF3B30")
          .setTitle("❌ Invalid Team")
          .setDescription(
            `Choose **${match.team1}** or **${match.team2}**`
          )
      ],
    });

  }

  if (user.coins < amount) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF3B30")
          .setTitle("💸 Not Enough Coins")
          .setDescription(
            `You only have **${user.coins.toLocaleString()}** coins.`
          )
      ],
    });

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

  const odds =
    team.toLowerCase() === match.team1.toLowerCase()
      ? match.odds1
      : match.odds2;

  const potentialWin = Math.floor(
    amount * odds
  );

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("🎟 Bet Placed Successfully")
    .setThumbnail(
      message.author.displayAvatarURL()
    )
    .addFields(
      {
        name: "⚽ Match",
        value: `${match.team1} 🆚 ${match.team2}`,
      },
      {
        name: "🎯 Pick",
        value: team,
        inline: true,
      },
      {
        name: "💰 Stake",
        value: `${amount.toLocaleString()} coins`,
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
        name: "🏦 Remaining Balance",
        value: `${user.coins.toLocaleString()} coins`,
      }
    )
    .setFooter({
      text: "VFN Sportsbook"
    })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(`betslip_${matchId}`)
        .setLabel("View Bet Slip")
        .setEmoji("🎟️")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`cancel_${matchId}`)
        .setLabel("Cancel Bet")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)

    );

  return message.reply({
    embeds: [embed],
    components: [row],
  });

}
```
```js
// ======================
// !mybets
// ======================
if (command === "mybets") {

  const bets = loadBets();

  const myBets = bets.filter(
    b => b.user === message.author.id
  );

  if (myBets.length === 0) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("🎟 My Bets")
      .setDescription(
        "You don't have any active bets."
      )
      .setFooter({
        text: "VFN Sportsbook"
      });

    return message.reply({
      embeds: [embed],
    });

  }

  const matches = loadMatches();

  for (const bet of myBets) {

    const match = matches.find(
      m => m.id === bet.matchId
    );

    if (!match) continue;

    const odds =
      bet.team.toLowerCase() === match.team1.toLowerCase()
        ? match.odds1
        : match.odds2;

    const potentialWin = Math.floor(
      bet.amount * odds
    );

    const embed = new EmbedBuilder()
      .setColor("#0099FF")
      .setTitle(`🎟 Bet Slip #${bet.matchId}`)
      .setDescription(
        `**${match.team1} 🆚 ${match.team2}**`
      )
      .addFields(
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
          name: "📊 Match Status",
          value: match.status,
          inline: true,
        }
      )
      .setFooter({
        text: "VFN Sportsbook"
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId(`betslip_${bet.matchId}`)
          .setLabel("Open Bet Slip")
          .setEmoji("🎟️")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId(`cancel_${bet.matchId}`)
          .setLabel("Cancel Bet")
          .setEmoji("❌")
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
// ======================
// !betslip
// ======================
if (command === "betslip") {

  const bets = loadBets();

  const bet = bets.find(
    b => b.user === message.author.id
  );

  if (!bet) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("🎟 Bet Slip")
      .setDescription(
        "You don't have any active bets."
      )
      .setFooter({
        text: "VFN Sportsbook"
      })
      .setTimestamp();

    return message.reply({
      embeds: [embed],
    });

  }

  const matches = loadMatches();

  const match = matches.find(
    m => m.id === bet.matchId
  );

  if (!match) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Match Not Found")
      .setDescription(
        "The match linked to this bet no longer exists."
      );

    return message.reply({
      embeds: [embed],
    });

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
    .setTitle("🎟 Official VFN Bet Slip")
    .setDescription(
      `**Match #${bet.matchId}**`
    )
  const embed = new EmbedBuilder()
  .setColor("#00C853")
  .setTitle("🎟 Official VFN Bet Slip")
  .setDescription(
    `**Match #${bet.matchId}**`
  )
     .addFields(
      {
        name: "⚽ Match",
        value: `${match.team1} 🆚 ${match.team2}`,
      },
      {
        name: "🎯 Your Pick",
        value: `**${bet.team}**`,
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
        name: "📊 Match Status",
        value: match.status,
        inline: true,
      }
    )
    .setFooter({
      text: `VFN Sportsbook • ${message.author.username}`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setTimestamp();
  .setTimestamp();
    const row = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId(`betslip_refresh_${bet.matchId}`)
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`cancel_${bet.matchId}`)
        .setLabel("Cancel Bet")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(match.status !== "OPEN"),

      new ButtonBuilder()
        .setCustomId(`match_${bet.matchId}`)
        .setLabel("View Match")
        .setEmoji("⚽")
        .setStyle(ButtonStyle.Secondary)

    );
    return message.reply({
    embeds: [embed],
    components: [row],
  });

}
```js
// ======================
// !closematch
// ======================
if (command === "closematch") {

  const matchId = parseInt(args[0]);

  if (!matchId) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Missing Match ID")
      .setDescription(
        "Usage:\n`!closematch MatchID`\n\nExample:\n`!closematch 1`"
      );

    return message.reply({
      embeds: [embed],
    });

  }

  const matches = loadMatches();

  const match = matches.find(
    m => m.id === matchId
  );

  if (!match) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Match Not Found")
      .setDescription(
        `No match exists with ID **${matchId}**.`
      );

    return message.reply({
      embeds: [embed],
    });

  }

  if (match.status === "CLOSED") {

    const embed = new EmbedBuilder()
      .setColor("#FF9500")
      .setTitle("⚠️ Already Closed")
      .setDescription(
        `Match #${match.id} is already closed.`
      );

    return message.reply({
      embeds: [embed],
    });

  }

  if (match.status === "FINISHED") {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("🏁 Match Finished")
      .setDescription(
        "This match already has a final result."
      );

    return message.reply({
      embeds: [embed],
    });

  }

  match.status = "CLOSED";

  saveMatches(matches);

  const embed = new EmbedBuilder()
    .setColor("#FF9800")
    .setTitle("🔒 Betting Closed")
    .setDescription(
      `**${match.team1} 🆚 ${match.team2}**`
    )
    .addFields(
      {
        name: "🆔 Match ID",
        value: match.id.toString(),
        inline: true,
      },
      {
        name: "📊 Status",
        value: "🔒 CLOSED",
        inline: true,
      },
      {
        name: "📢 Notice",
        value: "No more bets can be placed on this match.",
      }
    )
    .setFooter({
      text: "VFN Sportsbook"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });

}
```
```js
// ======================
// !result
// ======================
if (command === "result") {

  const matchId = parseInt(args[0]);
  const winner = args[1];

  if (!matchId || !winner) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Invalid Usage")
      .setDescription(
        "Usage:\n`!result MatchID Winner`\n\nExample:\n`!result 1 Barcelona`"
      );

    return message.reply({
      embeds: [embed],
    });

  }

  const matches = loadMatches();
  const bets = loadBets();

  const match = matches.find(
    m => m.id === matchId
  );

  if (!match) {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF3B30")
          .setTitle("❌ Match Not Found")
      ],
    });

  }

  if (match.status === "FINISHED") {

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF9500")
          .setTitle("⚠️ Result Already Recorded")
      ],
    });

  }

  match.status = "FINISHED";

  let winners = 0;
  let totalPaid = 0;
  let winnerList = "";
```
```js
  bets.forEach((bet) => {

    if (
      bet.matchId === matchId &&
      bet.team.toLowerCase() === winner.toLowerCase()
    ) {

      const allUsers = loadUsers();

      if (!allUsers[bet.user]) return;

      const multiplier =
        bet.team.toLowerCase() === match.team1.toLowerCase()
          ? match.odds1
          : match.odds2;

      const winnings = Math.floor(
        bet.amount * multiplier
      );

      allUsers[bet.user].coins += winnings;
      allUsers[bet.user].wins += 1;

      saveUsers(allUsers);

      winners++;
      totalPaid += winnings;

      winnerList +=
`🏆 <@${bet.user}>
💰 Won ${winnings.toLocaleString()} coins

`;

    } else if (bet.matchId === matchId) {

      const allUsers = loadUsers();

      if (allUsers[bet.user]) {
        allUsers[bet.user].losses += 1;
        saveUsers(allUsers);
      }

    }

  });
```
```js
  // Remove all bets for this match
  saveBets(
    bets.filter(
      bet => bet.matchId !== matchId
    )
  );

  saveMatches(matches);

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("🏁 FULL TIME")
    .setDescription(
      `**${match.team1} 🆚 ${match.team2}**`
    )
    .addFields(
      {
        name: "🏆 Winner",
        value: winner,
        inline: true,
      },
      {
        name: "🥇 Winning Bets",
        value: winners.toString(),
        inline: true,
      },
      {
        name: "💸 Total Paid Out",
        value: `${totalPaid.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "🎉 Winners",
        value:
          winnerList.length > 0
            ? winnerList
            : "No winning bets.",
      }
    )
    .setFooter({
      text: "VFN Sportsbook • Official Results"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });

}
```
```js
// ======================
// !cancelbet
// ======================
if (command === "cancelbet") {

  const matchId = parseInt(args[0]);

  if (!matchId) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Missing Match ID")
      .setDescription(
        "Usage:\n`!cancelbet MatchID`\n\nExample:\n`!cancelbet 1`"
      );

    return message.reply({
      embeds: [embed],
    });

  }

  const bets = loadBets();

  const betIndex = bets.findIndex(
    b =>
      b.user === message.author.id &&
      b.matchId === matchId
  );

  if (betIndex === -1) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Bet Not Found")
      .setDescription(
        "You don't have an active bet on this match."
      );

    return message.reply({
      embeds: [embed],
    });

  }

  const matches = loadMatches();

  const match = matches.find(
    m => m.id === matchId
  );

  if (!match) {

    const embed = new EmbedBuilder()
      .setColor("#FF3B30")
      .setTitle("❌ Match Not Found");

    return message.reply({
      embeds: [embed],
    });

  }

  if (match.status !== "OPEN") {

    const embed = new EmbedBuilder()
      .setColor("#FF9500")
      .setTitle("🔒 Betting Closed")
      .setDescription(
        "You can no longer cancel this bet."
      );

    return message.reply({
      embeds: [embed],
    });

  }

  const bet = bets[betIndex];

  user.coins += bet.amount;

  saveUsers(users);

  bets.splice(betIndex, 1);

  saveBets(bets);

  const embed = new EmbedBuilder()
    .setColor("#00C853")
    .setTitle("✅ Bet Cancelled")
    .setDescription(
      `Your bet has been cancelled successfully.`
    )
    .addFields(
      {
        name: "⚽ Match",
        value: `${match.team1} 🆚 ${match.team2}`,
      },
      {
        name: "💰 Refunded",
        value: `${bet.amount.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "🏦 New Balance",
        value: `${user.coins.toLocaleString()} coins`,
        inline: true,
      }
    )
    .setFooter({
      text: "VFN Sportsbook"
    })
    .setTimestamp();

  return message.reply({
    embeds: [embed],
  });

}
```
```js
// ======================
// !leaderboard
// ======================
if (command === "leaderboard") {

  const leaderboard = Object.entries(users)
    .sort((a, b) => b[1].coins - a[1].coins)
    .slice(0, 10);

  const medals = [
    "🥇",
    "🥈",
    "🥉",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
    "🔟"
  ];

  let leaderboardText = "";

  leaderboard.forEach(([id, data], index) => {

    leaderboardText +=
`${medals[index]} <@${id}>
💰 ${data.coins.toLocaleString()} coins
🏆 Wins: ${data.wins || 0}
❌ Losses: ${data.losses || 0}

`;

  });

  const embed = new EmbedBuilder()
    .setColor("#FFD700")
    .setTitle("🏆 VFN Sportsbook Leaderboard")
    .setDescription(
      leaderboardText || "No players yet."
    )
    .setFooter({
      text: "Top 10 Richest Players"
    })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("leaderboard_refresh")
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("profile_me")
        .setLabel("My Profile")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Secondary)

    );

  return message.reply({
    embeds: [embed],
    components: [row],
  });

}
```
```js
// ======================
// BUTTON HANDLER
// ======================
client.on("interactionCreate", async (interaction) => {

  // Handle buttons
  if (interaction.isButton()) {

    // ...all your button code goes here...

  }

  // Modal code goes below

  const users = loadUsers();
  const user = getUser(users, interaction.user.id);

  // ======================
  // Balance Button
  // ======================
  if (interaction.customId === "balance") {

    const embed = new EmbedBuilder()
      .setColor("#FFD700")
      .setTitle("💰 Your Balance")
      .setDescription(
        `You currently have **${user.coins.toLocaleString()}** coins.`
      )
      .setFooter({
        text: "VFN Sportsbook"
      });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

  }

  // ======================
  // Daily Button
  // ======================
  if (interaction.customId === "daily") {

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

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF9500")
            .setTitle("⏳ Daily Cooldown")
            .setDescription(
              `Come back in **${hours}h ${minutes}m**`
            )
        ],
        ephemeral: true,
      });

    }

    user.coins += 500;
    user.lastDaily = now;

    saveUsers(users);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#00C853")
          .setTitle("🎉 Daily Reward")
          .setDescription(
            `You received **500 coins!**\n\n💰 Balance: **${user.coins.toLocaleString()}**`
          )
      ],
      ephemeral: true,
    });

  }

});
```
```js
  // ======================
  // Bet Button
  // ======================
  if (interaction.customId.startsWith("bet_")) {

    const parts = interaction.customId.split("_");

    const matchId = parts[1];
    const team = parts.slice(2).join("_");

    const modal = new ModalBuilder()
      .setCustomId(`betmodal_${matchId}_${team}`)
      .setTitle("🎟 Place Bet");

    const amountInput = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Enter Bet Amount")
      .setPlaceholder("500")
      .setRequired(true)
      .setStyle(TextInputStyle.Short);

    const row = new ActionRowBuilder().addComponents(
      amountInput
    );

    modal.addComponents(row);

    return interaction.showModal(modal);

  }
```
```js
  // ======================
  // BET MODAL SUBMIT
  // ======================
  if (interaction.isModalSubmit()) {

    if (!interaction.customId.startsWith("betmodal_")) return;

    const parts = interaction.customId.split("_");

    const matchId = parseInt(parts[1]);
    const team = parts.slice(2).join("_");

    const amount = parseInt(
      interaction.fields.getTextInputValue("amount")
    );

    const users = loadUsers();
    const user = getUser(users, interaction.user.id);

    const matches = loadMatches();
    const bets = loadBets();

    const match = matches.find(
      m => m.id === matchId
    );

    if (!match) {
      return interaction.reply({
        content: "❌ Match not found.",
        ephemeral: true,
      });
    }

    if (match.status !== "OPEN") {
      return interaction.reply({
        content: "❌ Betting is closed.",
        ephemeral: true,
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return interaction.reply({
        content: "❌ Enter a valid amount.",
        ephemeral: true,
      });
    }

    if (user.coins < amount) {
      return interaction.reply({
        content: "❌ You don't have enough coins.",
        ephemeral: true,
      });
    }

    user.coins -= amount;
    user.wagered += amount;

    saveUsers(users);

    bets.push({
      user: interaction.user.id,
      matchId,
      team,
      amount,
    });

    saveBets(bets);

    const odds =
      team.toLowerCase() === match.team1.toLowerCase()
        ? match.odds1
        : match.odds2;

    const potentialWin = Math.floor(
      amount * odds
    );

    const embed = new EmbedBuilder()
      .setColor("#00C853")
      .setTitle("🎟 Bet Successfully Placed")
      .addFields(
        {
          name: "⚽ Match",
          value: `${match.team1} 🆚 ${match.team2}`,
        },
        {
          name: "🎯 Pick",
          value: team,
          inline: true,
        },
        {
          name: "💰 Stake",
          value: `${amount.toLocaleString()} coins`,
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
          name: "🏦 Remaining Balance",
          value: `${user.coins.toLocaleString()} coins`,
        }
      )
      .setFooter({
        text: "VFN Sportsbook"
      })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

  }
```
```js
// ======================
// !profile
// ======================
if (command === "profile") {

  const winRate =
    user.wins + user.losses === 0
      ? 0
      : Math.round(
          (user.wins /
            (user.wins + user.losses)) *
            100
        );

  const profit =
    user.coins - user.wagered;

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setAuthor({
      name: `${message.author.username}'s Profile`,
      iconURL: message.author.displayAvatarURL(),
    })
    .setThumbnail(
      message.author.displayAvatarURL()
    )
    .addFields(
      {
        name: "💰 Coins",
        value: `${user.coins.toLocaleString()}`,
        inline: true,
      },
      {
        name: "🏆 Wins",
        value: `${user.wins}`,
        inline: true,
      },
      {
        name: "❌ Losses",
        value: `${user.losses}`,
        inline: true,
      },
      {
        name: "📊 Win Rate",
        value: `${winRate}%`,
        inline: true,
      },
      {
        name: "💸 Lifetime Wagered",
        value: `${user.wagered.toLocaleString()} coins`,
        inline: true,
      },
      {
        name: "📈 Profit",
        value: `${profit.toLocaleString()} coins`,
        inline: true,
      }
    )
    .setFooter({
      text: "VFN Sportsbook Player Profile",
    })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("profile_refresh")
        .setLabel("Refresh")
        .setEmoji("🔄")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("leaderboard")
        .setLabel("Leaderboard")
        .setEmoji("🏆")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("balance")
        .setLabel("Wallet")
        .setEmoji("💰")
        .setStyle(ButtonStyle.Success)

    );

  return message.reply({
    embeds: [embed],
    components: [row],
  });

}
```
```js
// ======================
// !vfn
// ======================
if (command === "vfn") {

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("🏆 VFN SPORTSBOOK")
    .setDescription(
`Welcome, ${message.author.username}!

💰 Coins: **${user.coins.toLocaleString()}**

Choose an option below.`
    )
    .setThumbnail(
      message.author.displayAvatarURL()
    )
    .setFooter({
      text: "VFN Sportsbook Dashboard"
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("profile")
        .setLabel("Profile")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("balance")
        .setLabel("Wallet")
        .setEmoji("💰")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("daily")
        .setLabel("Daily")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Secondary)

    );

  const row2 = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("matches")
        .setLabel("Matches")
        .setEmoji("⚽")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("mybets")
        .setLabel("My Bets")
        .setEmoji("🎟️")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("leaderboard")
        .setLabel("Leaderboard")
        .setEmoji("🏆")
        .setStyle(ButtonStyle.Success)

    );

  const row3 = new ActionRowBuilder()
    .addComponents(

      new ButtonBuilder()
        .setCustomId("history")
        .setLabel("History")
        .setEmoji("📜")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("stats")
        .setLabel("Statistics")
        .setEmoji("📊")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("settings")
        .setLabel("Settings")
        .setEmoji("⚙️")
        .setStyle(ButtonStyle.Danger)

    );

  return message.reply({
    embeds: [embed],
    components: [row1, row2, row3],
  });

}
```
```js
// ======================
// MATCHES BUTTON
// ======================
if (interaction.customId === "matches") {

  const matches = loadMatches();

  if (matches.length === 0) {

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FF3B30")
          .setTitle("⚽ Open Matches")
          .setDescription("There are currently no open matches.")
      ],
      ephemeral: true,
    });

  }

  for (const match of matches) {

    const embed = new EmbedBuilder()
      .setColor(match.status === "OPEN" ? "#00C853" : "#FF9500")
      .setTitle(`🏆 Match #${match.id}`)
      .setDescription(`**${match.team1} 🆚 ${match.team2}**`)
      .addFields(
        {
          name: "📈 Odds",
          value:
`🔵 ${match.team1}: **${match.odds1}x**
🔴 ${match.team2}: **${match.odds2}x**`,
        },
        {
          name: "📊 Status",
          value: match.status,
          inline: true,
        }
      );

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`bet_${match.id}_${match.team1}`)
        .setLabel(match.team1)
        .setEmoji("🔵")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(match.status !== "OPEN"),

      new ButtonBuilder()
        .setCustomId(`bet_${match.id}_${match.team2}`)
        .setLabel(match.team2)
        .setEmoji("🔴")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(match.status !== "OPEN")

    );

    await interaction.followUp({
      embeds: [embed],
      components: [row],
      ephemeral: true,
    });

  }

  return interaction.reply({
    content: "⚽ Open Matches",
    ephemeral: true,
  });

}
```
// End of messageCreate
});

// ======================
// INTERACTION HANDLER
// ======================
client.on("interactionCreate", async (interaction) => {

  // All button handlers...

  // All modal handlers...

});

// ======================
// LOGIN
// ======================
client.login(process.env.DISCORD_TOKEN);
